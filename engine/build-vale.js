'use strict';
/* ---------- PX engine: the Vale Crown's buildings (the humans), and the Salt League's (buildmodels.js PX.registerBuildStyle) ---------- */
// The owner's doc (doc/references/assets/REALM_STRUCTURE_ART_DESIGN.md, Vale Crown and its climate variations): practical,
// prosperous, organised; pale stone, oak and plaster; red and orange pitched tile; royal blue and old gold; wheat, orderly braces,
// shield plaques; neat streets and squared yards.
// The Vale as built: white plaster under dark timber framing on a stone footing, orange tile (thatch on the farm's barn), brick
// chimneys, blue doors and blue shutters (its decals: DoorVale, DoorVale2, WinVale), the Crown's shield (gold cross on blue,
// ShieldVale) in a front gable, blue-and-gold banners (BannerVale) on its towers and walls, a road-facing sign bracket (SignVale);
// a fenced front garden with its beds and a gate at the door; the farm a long thatched barn with grain stacks, fenced field rows and a
// raised grain bin; the granary a timber-framed store on a tall stone plinth with painted measure marks and a ramp; the smithy an
// open-front oak shed with a brick chimney and its stock under an awning; the watch a pale stone square tower under a tile pyramid,
// banners, a low walled yard; the tavern two storeys, a striped awning and a sign; the manor (its hall) a long range and a two-storey
// cross-wing; the castle centres with banners, a formal court of planted beds, a stockpile; the village a civic marker, a grain bin
// and wheat. Climates (look slots): the desert adobe, flat roofs behind parapets, blue shade awnings, water jars and palms; the frost
// stone walls, steeper roofs, deeper eaves and a covered wood store; the swamp daub and plank on stilts; and by spec.env when the game
// passes them, forest (shingle, a porch and a woodpile), highland (stone, shorter roofs, a terrace wall) and coast (limewash, low
// tile, nets).
// The Salt League (Salt League): white plaster, sea stone, painted timber; low tile roofs and warehouse gables; teal and sea blue;
// rigging, shutters, rope, striped awnings; colourful, compact, commercial, busiest at the water. Built on the Vale's (from), its own:
// whitewash without framing, every pitched roof low (look.rise), teal doors and shutters (DoorLeague, WinLeague), balconies with
// planters, fish and anchor signs; the lighthouse its watch tower, a quay warehouse with teal cargo doors and a pulley beam its
// granary, a boat shed and sail loft its workshop, a stone smithy with sea vents and anchors, an arcaded tavern with awnings and a
// barrel yard; its port of piers, boats, a cargo crane, fish racks and amphorae; its farm an orchard, herb terraces and salt;
// its castles a lighthouse on the walls. The desert: whitewash under flat white roofs and awnings.
// Banners and civic accents are the culture's today; the owner's colour (a captured fort's new banners) waits for stage 3's spec.
(function(PX){
  const {house,dormer,shed,stilts,piece,made,prop:P,stable}=PX.planKit;

  /* the dressing every Vale and League plan gets last (types and clusters, idempotent): its decals by its look (blue doors, its
     sign), its pitched roofs by its look (rise: lower or steeper; eave: deeper), flat behind a parapet where its look is flat (the
     desert), chimneys cut down there */
  function dress(Q,o){const L=o.look,map=L.decals||{},boxes={};
    for(const dc of Q.decals)if(map[dc.kind])dc.kind=map[dc.kind];
    for(const p of Q.parts)if(p.k==='box')boxes[p.name]=p;
    for(const p of Q.parts){if(p.k!=='roof'||p.dr||p.keep)continue;p.dr=1;const b=boxes[p.on];if(!b||b.thin||b.keep||!/^(gable|hip|vault)$/.test(p.form))continue;
      if(L.flat){Object.assign(p,{form:'flat',parapet:1,merlons:false,mat:L.flatMat||'mud'});continue}
      if(p.form!=='vault'){p.rise=Math.max(3,Math.round(p.rise*(L.rise||1)));if(L.eave){p.o=(p.o==null?1:p.o)+L.eave;if(p.ov!=null)p.ov+=L.eave}}}
    for(const p of Q.parts)if(p.k==='chimney'&&!p.dr){p.dr=1;if(L.flat)p.z=[p.z[0],Math.min(p.z[1],p.z[0]+5)];else if(L.eave||(L.rise||1)>1)p.z=[p.z[0],p.z[1]+3]}
    return Q}

  /* the small pieces (plan px; n names the parts) */
  // a chimney of the culture's (the Vale's brick)
  const chimney=(Q,at,z0,z1,w)=>Q.chim(at,z0,z1,w||3,{mat:Q.o.look.chimney||'stone'});
  // a shade awning on two posts before a wall (its foot at v, across u0..u1, z its height), striped cloth, kept as built
  const awning=(Q,n,u0,u1,v,z,mat,dp)=>{dp=dp||4;Q.box(n,[u0,u1],[v,v+dp],[z,z+1],mat,{thin:true,keep:1});Q.roof(n,'shed','u',2,mat,{o:0,ov:0,keep:1});
    for(const u of [u0,u1-1.5])Q.box(n+'p'+u,[u,u+1.5],[v+dp-1.5,v+dp],[0,z],'timber',{top:true})};
  // a water jar of fired clay; a palm (its trunk, a ragged crown); a grain stack (a sheaf cone); a fruit tree (orchards)
  const jar=(Q,n,u,v)=>Q.round(n,[u,v],1.3,[0,3],'valeClay',{form:'lid',mat:'dark'});
  const palm=(Q,n,u,v,h,rs)=>{Q.round(n+'t',[u,v],1,[0,h],'log',null);Q.round(n+'c',[u,v],4.5,[h,h+1],'canopy',{form:'cone',rise:2,mat:'canopy',o:1,lip:0},{rough:.7,rs})};
  const stack=(Q,n,u,v,r)=>Q.round(n,[u,v],r||2.5,[0,3],'thatch',{form:'cone',rise:4,mat:'thatch',o:0});
  const tree=(Q,n,u,v,rs)=>{Q.round(n+'t',[u,v],1,[0,4],'log',null);Q.round(n+'c',[u,v],3.2,[4,6],'canopy',{form:'cone',rise:3,mat:'canopy',o:0,lip:0},{rough:.5,rs})};
  // a raised grain bin: a planked bin on four posts under a little pyramid of the roof, its hatch
  const bin=(Q,n,u,v,mat)=>{for(const [a,b] of [[-3.5,-3.5],[2,-3.5],[-3.5,2],[2,2]])Q.box(n+'l'+a+b,[u+a,u+a+1.5],[v+b,v+b+1.5],[0,4],'timber',{top:true});
    Q.box(n,[u-3.5,u+3.5],[v-3.5,v+3.5],[4,10],'plank',{frame:'timber'});Q.roof(n,'hip','u',4,mat,{o:1});Q.dec(n+'.S','Hatch',.5,1)};
  // the Crown's civic marker: a board on two posts, its shield (or the League's anchor) painted both sides
  const marker=(Q,n,u,v)=>{const L=Q.o.look;for(const s of [-1,1])Q.box(n+'l'+s,[u+s*2.5-1,u+s*2.5+1],[v,v+1.5],[0,5],'timber',{top:true});
    Q.box(n,[u-3.5,u+3.5],[v,v+1.5],[5,11],L.trim||'plank',{top:true,topMat:'timber'});Q.dec(n+'.S',L.plaque,.5,0);Q.dec(n+'.N',L.plaque,.5,0)};
  // a balcony before an upper floor (its wall at v, across u0..u1, its deck at z): the deck, a rail, a planter of flowers
  const balcony=(Q,n,u0,u1,v,z,mat)=>{Q.box(n,[u0,u1],[v,v+3],[z-1,z],'plank',{top:true,thin:true});Q.box(n+'r',[u0,u1],[v+2.5,v+3],[z,z+2],mat||'timber',{top:true,thin:true});
    Q.box(n+'f',[u0+1,u0+4],[v+.5,v+2],[z,z+1.5],'valeClay',{top:true,topMat:'flower'})};
  // a boat drawn up or moored: its hull along u (au) or v, its prow; a pier of planks on log piles; mooring posts
  const boat=(Q,n,u,v,len,au)=>{const h=len/2,b=2.5;Q.box(n,au?[u-h,u+h]:[u-b,u+b],au?[v-b,v+b]:[v-h,v+h],[0,2],'plank',{top:true,topMat:'timber'});
    Q.box(n+'p',au?[u+h,u+h+2]:[u-1,u+1],au?[v-1,v+1]:[v+h,v+h+2],[1,3],'plank',{top:true});Q.box(n+'s',au?[u-1,u+1]:[u-b,u+b],au?[v-b,v+b]:[v-1,v+1],[2,3],'timber',{top:true,thin:true})};
  const pier=(Q,n,u0,u1,v0,v1)=>{Q.box(n,[u0,u1],[v0,v1],[2,3],'plank',{top:true,thin:true});for(const u of [u0,u1-1.5])for(let v=v0+3;v<v1;v+=6)Q.box(n+'p'+u+'_'+v,[u,u+1.5],[v,v+1.5],[0,4],'log',{top:true})};
  // an anchor standing (iron, 2 px thick); a cargo crane on the quay (a mast, its jib, the rope and a hanging crate)
  const ANCHOR=['..iii..','...i...','.iiiii.','...i...','...i...','i..i..i','ii.i.ii','.iiiii.'];
  const anchor=(Q,n,u,v)=>Q.cut(n,u-3.5,v,0,ANCHOR,{i:'iron'},{dv:2});
  const crane=(Q,n,u,v)=>{Q.box(n+'b',[u-2.5,u+2.5],[v-2.5,v+2.5],[0,2],'stone',{top:true});Q.beam(n+'m',[u,v,2],[u,v,17],'timber');Q.beam(n+'j',[u,v,14],[u+5,v+6,19],'plank');
    Q.beam(n+'k',[u,v,9],[u+3,v+3,15],'timber');Q.box(n+'r',[u+4.5,u+5.5],[v+5.5,v+6.5],[9,18],'rope',{thin:true});Q.box(n+'c',[u+3.5,u+6.5],[v+4.5,v+7.5],[6,9],'plank',{top:true});Q.dec(n+'c.S','Crate',.5,0)};
  // amphorae stacked (the League's oil and wine)
  const amphorae=(Q,n,u,v)=>{for(const [a,b] of [[-2,-1],[1,-1.5],[-.5,1.5],[2.5,1.5]])Q.round(n+a+b,[u+a,v+b],1.2,[0,3.5],'valeClay',{form:'cone',rise:1,mat:'valeClay',o:0})};

  /* a house's yard by its look (look.yard): before its front (at v, across w round c, the door at du): a fenced garden, its beds
     either side of the path and a gate at the door (the Vale's neat fences); shade (the desert: an awning over the door, water
     jars); woodstore (the frost: a covered wood store); porch (the forest: a raised porch, a woodpile); terrace (the hills: a low
     stone wall, the beds behind it); nets (the coast) */
  function yard(Q,o,c,du,v,w){const L=o.look,k=L.yard||'garden',f=v+6,a=w/2,d=o.d;
    if(k==='shade'){awning(Q,'aw',c+du-4.5,c+du+4.5,v,10,d.pick(L.awnings));const s=du>0?-1:1;jar(Q,'j0',c+du+s*8,v+2.5);if(d.chance(.6))jar(Q,'j1',c+du+s*10.5,v+1.5);return}
    if(k==='woodstore'){const s=du>0?-1:1,u=c+s*(a-5);Q.box('ws',[u-4.5,u+4.5],[v,v+4],[6,7],'plank',{thin:true});Q.roof('ws','shed','u',2,o.roofMat,{o:1,ov:0});Q.prop('woodpile',[u,v+1.8],0,1.5);
      for(const x of [u-4.5,u+3])Q.box('wp'+x,[x,x+1.5],[v+2.5,v+4],[0,6],'timber',{top:true});return}
    if(k==='porch'){Q.box('pc',[c+du-5,c+du+5],[v,v+3.5],[0,1.5],'plank',{top:true});Q.prop('woodpile',[c+(du>0?-a+4:a-4),v+2.5],0,1.4);return}
    if(k==='nets'){Q.prop('nets',[c+(du>0?-a+4:a-4),v+3],0,1.6);Q.prop('barrel',[c+(du>0?-a+9:a-9),v+2.5],0,1.4);return}
    if(k==='terrace')for(const [n,u0,u1] of [['t0',-a-1,du-3],['t1',du+3,a+1]]){if(u1-u0>2)Q.box(n,[c+u0,c+u1],[f-1,f+.5],[0,2],'stone',{top:true,topMat:'moss'})}
    else Q.fence([[c-a,f],[c+a,f]],[[c+du-3,c+du+3,0]],4,'plank');
    for(const [u0,u1] of [[-a+1,du-4],[du+4,a-1]])if(u1-u0>=3)Q.bed([c+u0,c+u1],[v+1.5,f-1],'crop')}

  /* the Vale's plans (the League builds on them where it has none of its own): each reads its look, so the League's teal doors,
     low roofs and white walls come through them */
  const V={
    // a cottage: plaster under timber framing, a tile roof (now and then thatch, as the country's), a brick chimney, the blue door
    // and blue shutters, the Crown's shield in a front gable or an end one; its fenced front garden (its climate's yard); a dormer, a
    // window in the gable at better levels; on stilts in the swamp
    cottage(Q,o){const d=o.d,lv=o.lv,L=o.look,w=d.pick([18,20]),dd=16,form=d.pick(L.forms),dw=Q.home('cottage','home',lv>=3?2:1),roof=d.chance(.3)?o.roofMat:L.roof;
      Q.lift=o.stilts?4:0;const door=d.pick([.3,.5,.7]),h=house(Q,{w,d:dd,form,dw,door,roof,chim:false,pick:lv>=2?['WinF',L.win]:[L.win,'Win']});
      chimney(Q,form==='front'?[w/2-3,-dd/2+3]:[w/2-4,-1],h.z-1,h.z+h.rise+2);
      if(form==='front')Q.dec('h.S',L.plaque,.5,h.z+1,true);else if(form==='gable')Q.dec('h.E',L.plaque,.5,h.z+1,true);
      if(lv>=3&&form==='gable')dormer(Q,'dm',h.u,h.v,h.z,d.pick([-4,4]));stilts(Q,h.u,h.v);Q.lift=0;if(!o.bare)yard(Q,o,0,(door-.5)*w,dd/2,w)},
    // a townhouse: a pale stone ground floor, the upper of framed plaster jettied over it, its gable to the street or along it; the
    // blue door, a royal banner beside it or the shield in the street gable; a brick chimney
    townhouse(Q,o){const d=o.d,L=o.look,K=L.townhouse,w=16,dd=14,dw=Q.home('townhouse','home',2),front=d.chance(.6),wall=K.upper||o.wall,lo=K.lower||'stone';
      Q.box('lo',[-w/2,w/2],[-dd/2,dd/2],[0,11],lo,{dw});Q.box('h',[-w/2,w/2],[-dd/2,dd/2+1],[11,18],wall,{dw,frame:L.frame});
      Q.roof('h','gable',front?'v':'u',front?8:6,o.roofMat,{lip:1,ov:1});chimney(Q,[w/2-3,-dd/2+3],16,front?26:24);
      const da=d.pick([.28,.72]);Q.dec('lo.S',L.door,da);Q.dec('lo.S',front?L.win:L.banner,1-da,front?3:2);Q.dec('h.S',L.win,.25,1);Q.dec('h.S',L.win,.75,1);if(front)Q.dec('h.S',L.plaque,.5,8,true);
      Q.dec('lo.N',L.door,.5);Q.dec('h.N',L.win,.5,1);for(const k of ['E','W'])for(const a of [.3,.7]){Q.dec('h.'+k,'Win',a,1);Q.dec('lo.'+k,'Win',a,3)}},
    // a fisher's hut (the coast): limewashed under a low roof, storm shutters, its net on a rack, a boat drawn up before it
    fisherhut(Q,o){const L=o.look,w=16,dd=14,dw=Q.home('fisherhut');Q.lift=o.stilts?4:0;
      const h=house(Q,{w,d:dd,z:11,wall:L.flat?o.wall:'whitewash',frame:null,rise:5,roof:L.roof,dw,door:.3,chim:false,wins:1});stilts(Q,h.u,h.v);Q.lift=0;
      for(const b of [-4,4])Q.beam('np'+b,[w/2+3,b,0],[w/2+3,b,8],'timber');Q.cut('nt',-3,w/2+2.5,1,['nnnnnnn','n.n.n.n','nnnnnnn','n.n.n.n','nnnnnnn','n.n.n.n','.nnnnn.'],{n:'net'},{alongV:true});
      boat(Q,'bt',2,dd/2+5,9,true);Q.prop('barrel',[-w/2+1,dd/2+3],1,1.4)},
    // a manor (the Vale's hall): a long framed range under tile, its double door in a fenced front garden; a two-storey cross-wing at
    // its end, its gable to the front with the shield; brick chimneys; a thatched shed behind, a grain stack, a cart
    longhouse(Q,o){const d=o.d,L=o.look,dw=Q.home('longhouse','home',1,2),dw2=Q.home('manorwing','home',2,2);
      const h=house(Q,{w:38,d:16,c:[-7,2],z:12,rise:8,dw,door:.45,doorKind:L.door2,wins:4,chim:false,roof:L.roof,back:'door'});chimney(Q,[-21,0],11,23);
      const g=house(Q,{n:'wg',w:14,d:22,c:[19,3],st:2,form:'front',rise:8,dw:dw2,door:.5,wins:2,chim:false,roof:L.roof});Q.dec('wg.S',L.plaque,.5,g.z+1,true);chimney(Q,[22,-5],18,31);
      yard(Q,o,-7,(.45-.5)*38,10,36);shed(Q,'sh',[-14,-19],14,9,9,o.roofMat);stack(Q,'gs',2,-20,3.5);Q.prop('cart',[-27,-12],1)},
    // a watch tower: pale stone, square, under a tile pyramid; its blue door, the shield over it, banners on its sides, slits; a low
    // walled yard before it, its way in at the front, a rack of spears and a barrel
    tower(Q,o){const L=o.look,st=L.fort,dw=Q.home('tower','defence');Q.flag=true;
      Q.square('tw',[0,-3],11,[0,22],st,L.flat?{form:'battlements'}:{form:'pyramid',rise:7,mat:o.roofMat,o:1},{dw});
      Q.dec('tw.S',L.door,.5);Q.dec('tw.S',L.plaque,.5,12);Q.dec('tw.S','Slit',.5,18);for(const k of ['E','W']){Q.dec('tw.'+k,L.banner,.5,7);Q.dec('tw.'+k,'Slit',.5,17)}Q.dec('tw.N','Slit',.5,12);
      for(const [n,u,v] of [['ya',[-10,-3.5],[7,8.5]],['yb',[3.5,10],[7,8.5]],['yc',[-10,-7.5],[-7,8.5]],['yd',[7.5,10],[-7,8.5]]])Q.box(n,u,v,[0,4],st,{top:true});
      Q.box('rk',[-7,-5],[0,4],[0,7],'timber',{top:true,topMat:'iron'});Q.prop('barrel',[6,4],0,1.5)},
    // a smithy: an open-front oak shed (planks on a stone footing) under the roof, the forge glowing in it, a tall brick chimney at its
    // end; an awning on posts before it over its stock stacked in order (bar iron, crates, a cask); the anvil in the open
    smithy(Q,o){const L=o.look,dw=Q.home('smithy','work');
      Q.box('f',[-12,6],[-8,3],[0,11],L.shed||'plank',{dw,foot:'stone'});Q.roof('f','gable','u',6,o.roofMat,{ov:1});Q.dec('f.S','Forge',.35);Q.dec('f.N',L.door,.5);Q.dec('f.W',L.win,.5,3);
      chimney(Q,[8.5,-3],0,22,5);Q.box('aw',[-1,6],[3,9],[9,10],'timber',{thin:true});Q.roof('aw','shed','u',2,o.roofMat,{o:1,ov:0});
      for(const a of [-1,4.5])Q.box('po'+a,[a,a+1.5],[7.5,9],[0,9],'timber',{top:true});
      Q.box('bi',[1,5],[4,6],[0,2],'iron',{top:true});Q.box('bi2',[1.5,4.5],[4,5.5],[2,3],'iron',{top:true});Q.prop('crate',[3,7.5],0,1.5);Q.prop('anvil',[-6,11]);Q.prop('barrel',[10,6],0,1.6)},
    // a barn (the farm): long, framed plaster on a stone footing under a deep thatch, its braced doors, hatches at the ends; grain
    // stacks beside it, field rows in a fence before it
    barn(Q,o){const L=o.look,dw=Q.home('barn','store'),w=20,dd=15;
      Q.box('b',[-w/2,w/2],[-dd/2-1,dd/2-1],[0,11],L.barnWall||'daub',{dw,frame:L.frame,foot:'stone'});Q.roof('b','gable','u',8,o.roofMat,{lip:2,ov:1});
      Q.dec('b.S','Barn',.5);Q.dec('b.N',L.door,.5);for(const k of ['E','W']){Q.dec('b.'+k,'Hatch',.5,4)}
      stack(Q,'g0',w/2-1,dd/2+3,2.8);stack(Q,'g1',w/2+3,dd/2-3,2.4);
      if(!o.bare){Q.bed([-w/2,-3],[dd/2+1,dd/2+3],'crop');Q.bed([-w/2,-3],[dd/2+4.5,dd/2+6.5],'crop');Q.fence([[-w/2-1,dd/2],[-w/2-1,dd/2+8],[-2,dd/2+8],[-2,dd/2]],null,4,'plank')}},
    // a granary: a tall plinth of pale stone, its blue door and the painted measure marks; the store above timber-framed, shuttered,
    // under a tile hip; a ramp of stone steps up to its loading door, guarded by a lantern and the shield
    granary(Q,o){const L=o.look,dw=Q.home('granary','store'),w=16,dd=14,H=8;
      Q.box('pl',[-w/2,w/2],[-dd/2,dd/2],[0,H],L.fort,{dw});Q.box('g',[-w/2-1,w/2+1],[-dd/2-1,dd/2+1],[H,H+9],L.shed||'plank',{dw,frame:'timber'});Q.roof('g','hip','u',6,L.roof,{o:1});
      Q.dec('pl.S',L.door,.3);Q.dec('pl.S','MarkVale',.08,0);for(const k of ['E','W','N'])Q.dec('pl.'+k,'MarkVale',.5,1);
      Q.dec('g.S','Hatch',.2,2);Q.dec('g.S',L.plaque,.5,2);Q.dec('g.S','Door',.8,0);for(const k of ['E','W','N'])Q.dec('g.'+k,'Hatch',.5,2);
      for(let k=0;k<4;k++)Q.box('st'+k,[3,8],[dd/2,dd/2+(4-k)*1.5],[2*k,2*k+2],'plank',{top:true});Q.prop('lantern',[10,dd/2+3],0,1.5);Q.prop('sacks',[-5,dd/2+3],0,1.5)},
    // a workshop's store: framed plaster on a stone footing under tile, its double door, a loft with its hoist and a crate on the
    // rope; a brick chimney; an awning at its side over bolts and crates
    warehouse(Q,o){const L=o.look,dw=Q.home('warehouse','store');Q.box('w',[-11,11],[-8,8],[0,12],o.wall==='stone'?'daub':o.wall,{dw,frame:L.frame,foot:'stone'});Q.roof('w','gable','u',7,o.roofMat,{ov:1});
      Q.dec('w.S',L.door2,.3);Q.dec('w.S',L.win,.85,3);Q.dec('w.N',L.door,.5);for(const k of ['E','W'])for(const a of [.3,.7])Q.dec('w.'+k,a<.5?'Hatch':L.win,a,4);chimney(Q,[-8,-4],11,22);
      Q.box('lf',[2,8],[1,8],[11,17],'plank',{frame:'timber'});Q.roof('lf','gable','v',3,o.roofMat,{o:0,ov:1});Q.dec('lf.S','Hatch',.5,1);
      Q.box('ho',[4,6],[7,11],[16,18],'timber',{top:true});Q.box('rp',[4.5,5.5],[9.5,10.5],[10,16],'rope',{thin:true});Q.box('hc',[3.5,6.5],[8.5,11.5],[7,10],'plank',{top:true});
      Q.prop('sacks',[-11,10.5],0,1.5);Q.prop('crate',[9.5,10.5],0,1.5)},
    // a tavern: two storeys of framed plaster under tile (a gable with dormers, or a hip), two brick chimneys, its double door, the
    // sign on its bracket over the road and a lantern; a striped awning over the street windows; a back wing; the yard in a fence
    // (benches, a trough, barrels) with a stable shed at its back
    tavern(Q,o){const d=o.d,L=o.look,dw=Q.home('tavern','inn',2),hip=d.chance(.5);
      const h=house(Q,{w:32,d:18,c:[-12,9],st:2,form:hip?'hip':'gable',rise:9,dw,door:.5,doorKind:L.door2,wins:4,chim:false,pick:['WinF',L.win]});chimney(Q,[-24,8],18,31);chimney(Q,[0,8],18,30);
      Q.dec('h.S',L.sign,.64,11);Q.dec('h.S','Lamp',.38,8);if(!hip){dormer(Q,'d1',h.u,h.v,h.z,-19);dormer(Q,'d2',h.u,h.v,h.z,-5)}
      awning(Q,'aw',-28,-17,18,9,d.pick(L.awnings),3);
      house(Q,{n:'bw',w:16,d:14,c:[-20,-8],z:12,dw,door:.5,wins:1,chim:false});
      Q.fence([[8,18],[28,18],[28,-14]],[[14,20,0]],3);shed(Q,'sh',[18,-19],16,10,9,o.roofMat);
      Q.prop('bench',[14,6]);Q.prop('bench',[21,11]);Q.prop('trough',[22,-3]);Q.prop('barrel',[25,4]);Q.prop('barrel',[11,-6])},
    // a market stall: its counter under the culture's striped awning (the Vale's blue), wheat and goods on it, a crate or sacks behind
    stall(Q,o){const d=o.d,L=o.look,aw=d.pick(L.awnings),dw=Q.home('stall','trade');Q.ground='cobble';
      Q.box('ct',[-5,5],[0,3],[0,3],'plank',{dw,top:true,topMat:d.pick(['crop','linen','gold']),keep:1});
      for(const [a,b] of [[-6,-3],[5,-3],[-6,3],[5,3]])Q.box('po'+a+b,[a,a+1],[b,b+1],[0,6],'timber',{top:true});
      Q.box('aw',[-6,6],[-3.5,4],[6,7],aw,{thin:true,keep:1});Q.roof('aw',d.chance(.5)?'gable':'shed','u',2,aw,{o:1,ov:0,hi:'b0'});Q.dec('ct.S','Goods',.5,0);
      Q.prop(d.pick(['crate','sacks','barrel']),[-3,-1],0,1)},
    // a tent: the generic ridge tent in the culture's cloths (look.tents: the Vale's white and royal blue)
    tent(Q,o){const c=o.d.pick(o.look.tents),dw=Q.home('tent','home');
      Q.box('t',[-5.5,5.5],[-4.5,4.5],[0,2],c,{dw,keep:1});Q.roof('t','gable','v',7,c,{o:0,ov:0,lip:1,finial:1});Q.dec('t.S','Flap',.5,2,true);Q.prop('crate',[5.5,4.5],0,1)},
    // a keep: the generic, the culture's banners on its donjon and its front walls, a stockpile in its yard (crates, casks, sacks)
    keep(Q,o,base){base(Q,o);const L=o.look,dj=Q.parts.find(p=>p.name==='dj'),s=dj&&dj.c[0]<0?-1:1;for(const k of ['E','W','N'])Q.dec('dj.'+k,L.banner,.5,10);
      if(Q.parts.some(p=>p.name==='cwS0')){Q.dec('cwS0.S',L.banner,.5,2);Q.dec('cwS1.S',L.banner,.5,2)}
      Q.prop('crate',[s*12,12],0,2);Q.prop('crate',[s*15,12],0,2);Q.prop('barrel',[s*18,13],0,2);Q.prop('sacks',[s*13,16],0,2);Q.prop('barrel',[s*17,17],0,2)},
    // a citadel: the generic, its formal court planted in beds either side of the fountain, the culture's banners on its towers and
    // front walls
    citadel(Q,o,base){base(Q,o);const L=o.look,k=o.capital?2:1;for(const s of [-1,1])Q.bed(s<0?[-21*k,-7*k]:[7*k,21*k],[0,12*k],'crop');
      for(const n of ['pt-1','pt1'])Q.dec(n+'.S',L.banner,.5,4);if(Q.parts.some(p=>p.name==='cwS0')){Q.dec('cwS0.S',L.banner,.5,2);Q.dec('cwS1.S',L.banner,.5,2)}
      if(L.flat)for(const s of [-1,1])palm(Q,'pm'+s,s*22*k,-4*k,9,o.seed+s)},
    // a gatehouse: the generic, the culture's banners on its towers
    gatehouse(Q,o,base){base(Q,o);for(const s of [-1,1])Q.dec('t'+s+'.S',o.look.banner,.5,1)},
    // a village's centre: the generic (its hall by look.village), and the green's civic marker; then by look.green: wheat (the Vale: a
    // raised grain bin, fields in rows; palms and jars in the desert) or harbour (the League: boats drawn up, nets, amphorae)
    village(Q,o,base){base(Q,o);const L=o.look;marker(Q,'mk',5,1);
      if(L.green==='harbour'){boat(Q,'b0',-22,-1,10,false);boat(Q,'b1',22,6,10,false);Q.prop('nets',[-21,14],0,2);amphorae(Q,'am',20,-4);return}
      bin(Q,'gb',22,-1,o.roofMat);for(const s of [-1,1])for(let v=16;v<25;v+=4)Q.bed(s<0?[-27,-17]:[18,27],[v,v+2.5],'crop');
      if(L.flat){palm(Q,'p0',-23,2,10,o.seed);jar(Q,'j0',-4,10);jar(Q,'j1',-2,12)}else Q.bed([-27,-19],[-3,6],'crop')}
  };

  /* the Vale's clusters (the League's where it has none of its own) */
  const VC={
    // a farmstead: the farmhouse, the long thatched barn, a raised grain bin, grain stacks, field rows in a fence, a cart, a trough
    farmstead(C){const L=C.o.look;piece(C,'cottage',[-13,-15],0,{lv:2,bare:true});piece(C,'barn',[15,-12],0,{bare:true});
      made(C,[-26,4],0,Q=>bin(Q,'gb',0,0,C.o.roofMat));made(C,[2,8],0,Q=>{stack(Q,'s0',0,0,3);stack(Q,'s1',7,4,2.6)});
      for(let v=13;v<28;v+=4)C.Q.parts.push({k:'bed',name:'f'+v,u:[-29,-6],v:[v,v+2.5],topMat:'crop'});
      C.Q.parts.push({k:'fence',name:'ff',pts:[[-31,11],[-31,29],[-4,29],[-4,11]],h:4,mat:'plank'});piece(C,'cart',[18,16],0);P(C,'trough',[8,-1]);
      if(L.flat)made(C,[24,4],0,Q=>palm(Q,'pm',0,0,10,C.spec.seed|0))},
    // an inn: its house of two storeys on the street (the sign on its bracket, a lantern, a striped awning), the stable across the
    // yard, a well, a cart, a trough
    inn(C){const L=C.o.look;made(C,[-6,18],0,Q=>{const dw=Q.home('inn','inn',2);house(Q,{w:30,d:14,st:2,form:'hip',rise:8,dw,door:.5,doorKind:L.door2,wins:3,chim:false,pick:['WinF',L.win]});
        chimney(Q,[10,-2],18,29);Q.dec('h.S',L.sign,.68,10);Q.dec('h.S','Lamp',.34,7);awning(Q,'aw',-14,-6,7,9,C.d.pick(L.awnings),3)});
      stable(C,[12,-18],0);piece(C,'well',[-22,-14],0);piece(C,'cart',[22,4],0);P(C,'trough',[-4,-6])},
    // a market: stalls under the culture's awnings round a square, its fountain and the civic marker; carts, crates and casks
    market(C){piece(C,'stall',[-18,-18],0);piece(C,'stall',[0,-22],0);piece(C,'stall',[18,-18],0);piece(C,'stall',[-22,4],3);piece(C,'stall',[22,4],1);
      made(C,[0,2],0,Q=>{Q.round('fb',[0,0],5,[0,2],'stone',{form:'water'});Q.round('fp',[0,0],1.3,[0,6],'stone',{form:'lid',mat:'gold'});marker(Q,'mk',-9,6)});
      piece(C,'cart',[-14,22],0);piece(C,'crates',[14,22],0);piece(C,'barrels',[2,24],0)},
    // a fishery (the Vale's coast): the fish store, the tax house of stone with the banner, a pier into the water, a boat, nets, casks
    fishery(C){const L=C.o.look;C.Q.parts.push({k:'bed',name:'sea',u:[-31,31],v:[13,31],topMat:'water'});piece(C,'fisherhut',[-14,-14],0,{cut:['prop']});
      made(C,[14,-14],0,Q=>{const dw=Q.home('taxhouse','trade');house(Q,{w:16,d:12,z:12,wall:L.fort,roof:L.roof,dw,door:.5,wins:2,chim:false,rise:6});Q.dec('h.S',L.banner,.15,2);Q.dec('h.S',L.banner,.85,2)});
      made(C,[0,0],0,Q=>{pier(Q,'pr',-4,2,8,30);boat(Q,'bt',10,22,10,false)});P(C,'nets',[-24,8]);P(C,'nets',[24,4],1);piece(C,'barrels',[-6,4],0)},
    // a camp: tents round the fire, crates, the culture's flag (the game's) over it
    camp(C,base){base(C);C.Q.flag=true}
  };

  /* the League's own plans */
  const LG={
    // a League house: two storeys of whitewash under a low roof (a hip or a gable), its teal door and shutters, a balcony with its
    // planter on the upper floor or a laundry line beside it; on stilts in the swamp
    cottage(Q,o){const d=o.d,L=o.look,w=16,dd=14,dw=Q.home('cottage','home',2),form=d.pick(['hip','hip','gable']),door=d.pick([.3,.7]);Q.lift=o.stilts?4:0;
      const h=house(Q,{w,d:dd,st:2,form,rise:7,dw,door,chim:false,wins:2,roof:L.roof,pick:[L.win]});chimney(Q,[door<.5?w/2-3:-w/2+3,-dd/2+3],18,26);
      if(d.chance(.6))balcony(Q,'bc',-w/2+1,w/2-1,dd/2,12,L.trim);else Q.prop('washing',[(door<.5?1:-1)*(w/2+1),dd/2+3],1,1.4);stilts(Q,h.u,h.v);Q.lift=0;
      if(!o.bare&&L.flat)yard(Q,o,0,(door-.5)*w,dd/2,w);else if(!o.bare)Q.prop(d.pick(['barrel','crate']),[(door<.5?-1:1)*-(w/2-2),dd/2+2.5],0,1.4)},
    // a townhouse: three storeys narrow and tall, a low hip, a balcony on the middle floor, a shop's arch beside the door
    townhouse(Q,o){const d=o.d,L=o.look,w=14,dd=14,dw=Q.home('townhouse','home',3),door=d.pick([.28,.72]);
      house(Q,{w,d:dd,st:3,form:'hip',rise:7,dw,door,chim:false,wins:0,roof:L.roof});chimney(Q,[w/2-3,-dd/2+3],25,33);Q.dec('h.S','Arch',1-door,0);
      for(const z of [13,20]){for(const a of [.27,.73])Q.dec('h.S',L.win,a,z);for(const k of ['E','W','N'])Q.dec('h.'+k,L.win,.5,z)}Q.dec('h.N',L.win,.5,3);balcony(Q,'bc',-w/2+1,w/2-1,dd/2,12,L.trim)},
    // a granary: a long warehouse of sea stone on its raised quay, its gable to the water, teal cargo doors, a pulley beam out of the
    // gable with its rope and a crate, hatches down its sides, steps up to the quay
    granary(Q,o){const L=o.look,dw=Q.home('granary','store'),w=18,dd=18,H=3,z=13;
      Q.box('qy',[-w/2-3,w/2+3],[-dd/2-2,dd/2+3],[0,H],'stone',{dw,top:true});Q.lift=H;
      Q.box('w',[-w/2,w/2],[-dd/2,dd/2],[0,z],L.fort,{dw});Q.roof('w','gable','v',9,o.roofMat,{o:1,ov:1});Q.dec('w.S','DoorCargoLeague',.5);Q.dec('w.S','Hatch',.5,z+1,true);
      for(const k of ['E','W'])for(const a of [.25,.75])Q.dec('w.'+k,'Hatch',a,5);Q.dec('w.N','DoorCargoLeague',.5);
      Q.beam('pb',[0,dd/2-1,z+4],[0,dd/2+3,z+4],'timber');Q.box('rp',[-.5,.5],[dd/2+2,dd/2+3],[z+1,z+4],'rope',{thin:true});Q.lift=0;
      Q.box('cr',[-1.5,1.5],[dd/2+1,dd/2+4],[H+z-2,H+z+1],'plank',{top:true});Q.box('sp',[w/2-1,w/2+3],[dd/2+3,dd/2+5],[0,1.5],'stone',{top:true});Q.prop('crate',[-w/2-1,dd/2+1.5],0,1.4);Q.prop('barrel',[-w/2+2,dd/2+1.5],0,1.4)},
    // a workshop: the sail loft (two storeys of whitewash, its gable to the front, a hatch with a sail hung out of it) and the boat
    // shed beside it open on posts, a hull on its trestles, an anchor
    warehouse(Q,o){const L=o.look,dw=Q.home('warehouse','work');
      house(Q,{w:13,d:14,c:[-5,-2],st:2,form:'front',rise:7,dw,door:.5,doorKind:L.door2,wins:1,chim:false,roof:L.roof,pick:[L.win]});
      Q.prop('sacks',[-10,7],0,1.4);Q.box('sb',[2,12],[-9,-7],[0,9],'plank',{foot:'stone'});for(const a of [2,10.5])Q.box('sp'+a,[a,a+1.5],[6,7.5],[0,9],'timber',{top:true});
      Q.box('sr',[2,12],[-9,7.5],[9,10],'timber',{thin:true});Q.roof('sr','shed','u',3,o.roofMat,{o:1,ov:0});
      for(const a of [4,9])Q.box('tr'+a,[a,a+1],[-3,3],[0,2],'timber',{top:true});boat(Q,'hl',7,0,9,false);anchor(Q,'an',-11,9)},
    // a smithy: sea stone under a low roof, its forge open to the front, sea vents along its sides, a squat stone chimney; anchors
    // stacked outside, chain, a cask
    smithy(Q,o){const L=o.look,dw=Q.home('smithy','work');
      Q.box('f',[-10,8],[-8,5],[0,11],L.fort,{dw});Q.roof('f','gable','u',6,o.roofMat,{ov:1});Q.dec('f.S','ForgeS',.35);Q.dec('f.N',L.door,.5);
      for(const k of ['E','W'])for(const a of [.3,.7])Q.dec('f.'+k,'VentLeague',a,4);Q.dec('f.N','VentLeague',.2,4);Q.dec('f.N','VentLeague',.8,4);
      Q.chim([4,-3],8,20,5);anchor(Q,'a0',6,8);anchor(Q,'a1',12,9);Q.prop('anvil',[-6,9]);Q.prop('barrel',[-10,10],0,1.6);Q.box('ch',[-2,1],[8,10],[0,1],'iron',{top:true})},
    // a tavern: two storeys of whitewash under a low hip, an arcade along its front (open arches either side of its double door),
    // teal shutters above, the fish sign over the road; striped awnings over a terrace; a barrel yard behind a low wall
    tavern(Q,o){const d=o.d,L=o.look,dw=Q.home('tavern','inn',2);
      house(Q,{w:32,d:18,c:[-12,9],st:2,form:'hip',rise:9,dw,door:.5,doorKind:L.door2,wins:0,chim:false});chimney(Q,[-24,8],18,30);
      for(const a of [.12,.29,.71,.88])Q.dec('h.S','Arch',a,0);for(const a of [.15,.32,.68,.85])Q.dec('h.S',L.win,a,13);Q.dec('h.S',L.sign,.5,11);
      for(const k of ['E','W','N'])for(const a of [.3,.7])Q.dec('h.'+k,L.win,a,13);Q.dec('h.N',L.door,.5);
      awning(Q,'a0',2,13,4,9,'awningB',5);awning(Q,'a1',14,25,4,9,'awning',5);for(const [u,v] of [[6,12],[18,12]])Q.prop('bench',[u,v]);
      Q.box('yw',[4,28],[-17,-15.5],[0,4],'stone',{top:true});Q.box('yw2',[26.5,28],[-17,2],[0,4],'stone',{top:true});
      for(const [u,v] of [[8,-12],[12,-12],[16,-12],[20,-12],[10,-8],[14,-8],[18,-8],[23,-6]])Q.prop('barrel',[u,v],0,1.8);anchor(Q,'an',-24,21)},
    // a lighthouse (the League's watch): a tall round tower of whitewash with a teal band, its gallery, the lantern lit under a teal
    // cap; its teal door, small windows up it, a banner; rocks at its foot, a mooring post
    tower(Q,o){const L=o.look,dw=Q.home('tower','defence'),z=20;Q.flag=true;
      Q.round('tw',[0,-1],5,[0,z],'whitewash',null,{dw});Q.round('bd',[0,-1],5.3,[11,13],'leagueTeal',null,{dw});Q.round('gl',[0,-1],7,[z,z+1],L.fort,{form:'lid',mat:'plank'},{dw});
      Q.round('ln',[0,-1],3.5,[z+1,z+5],'glass',{form:'cone',rise:4,mat:'leagueTeal',o:1},{dw});
      Q.dec('tw.S',L.door,.5);for(const k of ['E','W','N'])Q.dec('tw.'+k,'Slit',.5,6);Q.dec('tw.S','Slit',.5,15);Q.dec('tw.E',L.banner,.5,1);
      for(const [a,b,k] of [[-8,4,1.6],[7,5,1.8],[-6,8,1.2],[9,1,1.2]])Q.prop('boulder',[a,b],0,k);Q.box('mp',[4,6],[8,10],[0,4],'log',{top:true})}
  };
  // the League's castles: the Vale's, a lighthouse for a tower (the keep's front-left corner, the citadel's right palace tower)
  const lighthouse=(Q,n,c,z)=>{Q.round(n,c,4.5,[0,z],'whitewash',null);Q.round(n+'b',c,4.8,[Math.round(z*.55),Math.round(z*.55)+2],'leagueTeal',null);
    Q.round(n+'g',c,6,[z,z+1],'stone',{form:'lid',mat:'plank'});Q.round(n+'l',c,3,[z+1,z+5],'glass',{form:'cone',rise:4,mat:'leagueTeal',o:1})};
  const swapTower=(Q,name,c,z)=>{if(!Q.parts.some(p=>p.name===name))return;Q.parts=Q.parts.filter(p=>p.name!==name);Q.decals=Q.decals.filter(d=>!d.wall.startsWith(name+'.'));lighthouse(Q,'lh',c,z)};
  LG.keep=(Q,o,base)=>{V.keep(Q,o,base);swapTower(Q,'tSW',[-25,24],22)};
  LG.citadel=(Q,o,base)=>{V.citadel(Q,o,base);const k=o.capital?2:1;swapTower(Q,'pt1',[17*k,-17*k],Math.round(30*(o.capital?1.6:1)))};

  /* the League's clusters */
  // a row of League houses wall to wall along the street (+v) from u0 to u1, their fronts at v1: narrow, two or three storeys, low
  // hips and gables, teal shutters, balconies with planters
  function lrow(C,u0,u1,v1,face){const R=C.d,L=C.o.look;let u=u0;while(u1-u>=12){const w=u1-u<28?u1-u:R.pick([14,16,18]),st=R.pick([2,2,3]),d=R.pick([12,14]),bal=R.chance(.5),door=R.pick([.3,.7]);
      made(C,[u+w/2,v1-d/2],face,Q=>{const dw=Q.home('townhouse','home',st,st>=3?3:2);house(Q,{w,d,st,form:R.pick(['hip','gable','hip']),rise:6,dw,door,wins:w>=16?2:1,ov:0,chim:R.chance(.4),pick:[L.win,'WinF']});
        if(bal)balcony(Q,'bc',-w/2+1,w/2-1,d/2,12,L.trim)},{wall:R.pick(L.walls)});u+=w}}
  const LC={
    row:C=>{lrow(C,-30,30,26,0);const R=C.d;made(C,[R.pick([-16,14]),-18],0,Q=>shed(Q,'s',[0,0],14,8,9,C.o.roofMat,Q.home('shed','store')));
      C.Q.parts.push({k:'fence',name:'yf',pts:[[-30,-4],[30,-4]],h:4});P(C,'washing',[R.pick([-6,4]),-12]);P(C,'washing',[R.pick([-22,20]),-24]);piece(C,'barrels',[22,-28],0)},
    quarter:C=>{lrow(C,-62,-8,60,0);lrow(C,8,62,60,0);lrow(C,-62,-8,-4,0);lrow(C,8,62,-4,0);lrow(C,-62,-8,-40,0);lrow(C,8,62,-40,0);
      piece(C,'well',[0,14],0);piece(C,'barrels',[-18,24],0);made(C,[20,24],0,Q=>amphorae(Q,'am',0,0));P(C,'washing',[-30,-20]);P(C,'washing',[34,-22]);P(C,'bench',[-6,30],1)},
    // a port: the harbour before it, two piers on their piles with boats moored, a cargo crane on the quay, a fisher's house, fish
    // racks, mooring posts, amphorae and casks
    fishery(C){C.Q.parts.push({k:'bed',name:'sea',u:[-31,31],v:[9,31],topMat:'water'});piece(C,'fisherhut',[-16,-16],0,{cut:['prop']});
      made(C,[0,0],0,Q=>{pier(Q,'p0',-22,-16,6,30);pier(Q,'p1',4,10,6,30);boat(Q,'b0',-11,20,10,false);boat(Q,'b1',15,22,9,false);crane(Q,'cr',18,-2);
        for(const u of [-28,-6,22])Q.box('mp'+u,[u,u+2],[7,9],[0,4],'log',{top:true});amphorae(Q,'am',-2,-6);Q.prop('nets',[6,-14],0,2);Q.prop('nets',[14,-16],1,2)});piece(C,'barrels',[-28,2],0)},
    // a farm: the farmhouse, an orchard of fruit trees, herb beds terraced behind low stone walls, a salt shed with its heaps, fish racks
    farmstead(C){piece(C,'cottage',[-14,-16],0,{bare:true});made(C,[0,0],0,Q=>{for(const [u,v] of [[6,-24],[16,-22],[26,-20],[10,-12],[21,-10]])tree(Q,'t'+u,u,v,(C.spec.seed|0)+u);
        for(let k=0;k<3;k++){const v=6+k*8;Q.box('tw'+k,[-30,-4],[v+4.5,v+6],[0,2],'stone',{top:true,topMat:'moss'});Q.bed([-29,-5],[v,v+4],'crop')}
        shed(Q,'ss',[18,10],14,9,9,C.o.roofMat,Q.home('saltshed','store'));for(const [u,v] of [[10,22],[16,24]])Q.round('sh'+u,[u,v],2.6,[0,1],'whitewash',{form:'cone',rise:3,mat:'whitewash',o:0});
        Q.prop('nets',[26,24],0,2)})},
    // a market: an arcaded hall at its back (open arches under a low roof), stalls under striped awnings, a barrel yard, the fish sign
    market(C){const L=C.o.look;made(C,[0,-20],0,Q=>{const dw=Q.home('arcade','trade');house(Q,{w:40,d:12,z:12,form:'hip',rise:6,dw,door:.5,doorKind:L.door2,wins:0,chim:false});
        for(const a of [.1,.24,.38,.62,.76,.9])Q.dec('h.S','Arch',a,0);Q.dec('h.S',L.sign,.5,10)});
      piece(C,'stall',[-20,0],3);piece(C,'stall',[20,0],1);piece(C,'stall',[-8,8],0);piece(C,'stall',[8,8],0);piece(C,'barrels',[-20,22],0);piece(C,'barrels',[-12,24],0);
      made(C,[18,22],0,Q=>amphorae(Q,'am',0,0));piece(C,'cart',[4,24],0)},
    // an inn: the arcaded tavern's house with its sign, its stable, casks stacked by the door, an awning
    inn(C){const L=C.o.look;made(C,[-6,18],0,Q=>{const dw=Q.home('inn','inn',2);house(Q,{w:30,d:14,st:2,form:'hip',rise:8,dw,door:.5,doorKind:L.door2,wins:0,chim:false});
        for(const a of [.14,.3,.7,.86])Q.dec('h.S','Arch',a,0);for(const a of [.2,.5,.8])Q.dec('h.S',L.win,a,13);Q.dec('h.S',L.sign,.42,10);awning(Q,'aw',-14,-2,7,9,'awningB',3)});
      stable(C,[12,-18],0);piece(C,'barrels',[22,4],0);piece(C,'barrels',[-22,-8],0);P(C,'trough',[-4,-6])}
  };

  // every type and cluster dressed by its culture's look last (its own plan or the generic)
  const wrapT=f=>(Q,o,base)=>{if(f)f(Q,o,base);else base(Q,o);dress(Q,o)},wrapC=f=>(C,base)=>{if(f)f(C,base);else base(C);dress(C.Q,C.o)};
  const TYPES=PX.MODEL_TYPES.concat(PX.MODEL_SITES),KINDS=PX.CLUSTER_MODELS;
  const table=(own,all,wrap)=>Object.fromEntries(all.map(k=>[k,wrap(own[k])]));

  /* the decals (model.js PX.MODEL_EXTRA): letters = and + the Crown's blue (lit, shade), * whitewash paint, % paper, ~ and @ the
     League's teal (lit, shade) */
  const letters={'=':['valeBlue',1],'+':['valeBlue',2],'*':['whitewash',0],'%':['linen',1],'~':['leagueTeal',1],'@':['leagueTeal',2]};
  const decals={
    DoorVale:['.ttt.','t=+=t','t=+=t','t=+=t','t===t','t=+kt','t=+=t','t=+=t','ppppp'],DoorVale2:['.ttttt.','t=+t+=t','t=+t+=t','t=+t+=t','t=+t+=t','t=ktk=t','t=+t+=t','t=+t+=t','t=+t+=t','ppppppp'],
    WinVale:['.llll.','=tGgt=','+tggt+','=tggt=','.tttt.'],BannerVale:['ttttt','=====','==y==','=yyy=','==y==','=====','+=+=+','+.+.+'],
    ShieldVale:['yyyyy','y=y=y','yyyyy','y=y=y','.y=y.','..y..'],SignVale:['ttttt.','....t.','.yyyyy','.y=+=y','.yyyyy'],
    MarkVale:['*=','*.','*=','*.','*=','*.','*='],NoticeVale:['tttttt','t*%*bt','tb*%*t','t%*b%t','tttttt'],
    DoorLeague:['.ttt.','t~@~t','t~@~t','t~@~t','t~~~t','t~@kt','t~@~t','t~@~t','ppppp'],DoorLeague2:['.ttttt.','t~@t@~t','t~@t@~t','t~@t@~t','t~@t@~t','t~ktk~t','t~@t@~t','t~@t@~t','t~@t@~t','ppppppp'],
    DoorCargoLeague:['ttttttttt','t~@~t~@~t','t~@~t~@~t','t~@~t~@~t','ttttttttt','t~@~t~@~t','t~@~t~@~t','t~@~t~@~t','t~@~t~@~t','ppppppppp'],
    WinLeague:['.llll.','~tGgt~','@tggt@','~tggt~','.tttt.'],BannerLeague:['ttttt','~~~~~','~***~','~~~~~','~***~','~~~~~','@~@~@','@.@.@'],
    PlaqueLeague:['~~*~~','~***~','~~*~~','*~*~*','~***~','~~~~~'],SignFish:['tttttt.','.....t.','.~~~..~','~*~~~~~','.~~~..~'],VentLeague:['lllll','l###l','lllll','l#o#l','lllll']};

  PX.registerBuildStyle('vale',{
    // the style table (buildmodels.js LOOK0 its shape), and the Vale's own say for its plans: its decals swapped in for the
    // generic's (decals), its banner, plaque, sign and double door, its chimneys' brick, its awnings, its yards (yard), its green
    // (village: wheat), the roofs' rise and eaves (rise, eave) and flat roofs (flat, flatMat: the desert), the barn's walls
    look:{people:'human',
      roof:'tile',rural:'thatch',walls:['whitewash','whitewash','daub'],frame:'timber',stone:'stone',fort:'stone',fieldstone:'stone',wood:'plank',silo:'stone',felt:'canvas',
      trim:'valeBlue',accent:'gold',ground:null,
      forms:['gable','gable','front','hip'],cones:true,hall:'longhouse',door:'DoorVale',win:'WinVale',finial:'timber',
      townhouse:{upper:'whitewash',lower:'stone'},
      village:{form:'gable',rise:10,door:'DoorVale2',chim:[8,-16],goods:['hay','barrel']},
      decals:{Door:'DoorVale',Door2:'DoorVale2',WinS:'WinVale',Sign:'SignVale'},door2:'DoorVale2',banner:'BannerVale',plaque:'ShieldVale',sign:'SignVale',chimney:'valeBrick',
      awnings:['awningB','awningB','awning'],tents:['canvas','canvasB','canvas'],yard:'garden',green:'wheat',barnWall:'daub',shed:'plank',rise:1,eave:0,flat:false,flatMat:'mud',
      // the climates: the desert (adobe and sun-bleached plaster, flat roofs behind parapets, shade awnings, jars and palms; castle
      // towers flat), the swamp (daub and plank, stilts by the spec), the frost frontier (stone, steeper roofs, deeper eaves, a covered
      // wood store); and, when the game passes them as env, the forest march, the highland and the coast
      desert:{wall:null,walls:['adobe','adobe','whitewash'],frame:null,rural:'tile',flat:true,cones:false,yard:'shade',barnWall:'adobe',shed:'adobe',townhouse:{upper:'adobe',lower:'adobe'},village:{wall:'adobe'}},
      swamp:{walls:['daub','plank','daub']},
      frost:{walls:['stone','whitewash','stone'],rise:1.35,eave:1,yard:'woodstore',barnWall:'stone'},
      forest:{roof:'shingle',walls:['daub','daub','plank'],yard:'porch'},highland:{walls:['stone','stone','whitewash'],rise:.8,yard:'terrace',townhouse:{upper:'stone'}},
      coast:{walls:['whitewash'],rise:.8,yard:'nets'}},
    own:{types:{}},
    types:table(V,TYPES,wrapT),clusters:table(VC,KINDS,wrapC),centres:{},
    textures:{valeBrick:'stone'},
    materials:{valeBlue:['#86a8f0','#4068c8','#2c4a98','#1e2e62'],valeBrick:['#d88068','#b04e3c','#803630','#52262a'],valeClay:['#f0b07a','#cc7c4c','#9a5638','#643a2c'],
      leagueTeal:['#86e6d6','#36b4a6','#22827c','#18504e']},
    letters,decals});
  // the Salt League: the Vale's plans where it has none of its own, its look over the Vale's
  PX.registerBuildStyle('league',{from:'vale',
    look:{people:'human',roof:'tile',rural:null,walls:['whitewash','whitewash','daub'],frame:null,trim:'leagueTeal',accent:'awningB',
      forms:['hip','hip','gable','front'],door:'DoorLeague',win:'WinLeague',townhouse:{upper:'whitewash',lower:'stone'},
      village:{form:'hip',rise:8,wall:'whitewash',door:'DoorLeague2',chim:false,goods:['nets','barrel']},
      decals:{Door:'DoorLeague',Door2:'DoorLeague2',WinS:'WinLeague',Sign:'SignFish',DoorVale:'DoorLeague',DoorVale2:'DoorLeague2',WinVale:'WinLeague'},door2:'DoorLeague2',
      banner:'BannerLeague',plaque:'PlaqueLeague',sign:'SignFish',chimney:'stone',awnings:['awningB','awning','awningB'],tents:['canvasB','canvas','linen'],yard:'nets',green:'harbour',barnWall:'plank',rise:.6,eave:0,
      desert:{wall:null,walls:['whitewash'],flat:true,flatMat:'adobe',cones:false,yard:'shade'},swamp:{},frost:{rise:1,eave:1,yard:'woodstore'},
      forest:{},highland:{},coast:{}},
    own:{types:{}},
    types:table(LG,Object.keys(LG),wrapT),clusters:table(LC,Object.keys(LC),wrapC),centres:{}});
})(window.PX=window.PX||{});
