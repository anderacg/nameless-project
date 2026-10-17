'use strict';
/* ---------- PX engine: the battlefield's ground (terrain phases 1-4: hills as three terraces, woods, marsh; rivers; standing trees and cliff faces; mountains, sheer cliffs and ramps) ---------- */
// PX.battleGround(spec) paints a battle's terrain over its base ground, once a battle, as one canvas the size of the field. spec is
// the game's B.terrain (doc/TERRAIN_DESIGN.md §4: {C,R,cs,kind,lvl,seed}) plus climate ('grass' 'frost' 'desert' 'swamp': B.env.c)
// and base (the climate's arena canvas: copied in, never changed; without it a plain climate ground is painted, w×h or C·cs×R·cs).
// kind: 0 open, 1 wood, 2 marsh, 3 ford, 4 deep, 5 bridge (deep water under a deck), 6 rock (a mountain or spire); lvl: 0-2, the
// terrace. Read: lvl, kind, the recipe's kind (spec.recipe.kind, or a fixture's name: a hills battle's bridge is stone) and, in
// phase 4, rockH (a rock cell's height in levels, PX.ROCK_PX px each unless spec.rockPx; none: 3) and wall (edge bits E 1, S 2,
// W 4, N 8: a bit on either side of a terrace edge makes it a sheer cliff, none a slope; no wall at all: every edge as before).
// Same spec, same picture: seeded, never Math.random.
// PX.battleWater(g,ground,t,view): a river's motion over its painted ground, each frame (glints, current, riffles, sparkles on ice).
// PX.battleGroundMini(spec,ground): the small map's picture, one pixel a cell (C×R), the painted ground averaged with its contours.
// Standing props (phase 3): the trees (32-px sprites, PX.battleTree) and the plateaus' south cliff faces are not left in the
// picture for good but handed back as cv.props, sorted by their feet, for the game to draw in the same depth order as its soldiers
// (and fade over its own); their shadows, roots, undergrowth and bushes stay painted. PX.battleProps(g,ground,view) draws them in
// order over the ground alone (the gallery).
// Phase 4: mountains and spires (kind 6) rise up the screen with real height, painted in the ground and handed back as props too
// (dk 3, cut as the faces are) so a soldier behind one is under it and yours make it fade; their shadows and scree stay painted.
// With walls a sheer cliff is grey rock, taller (12 px a level), cracked, a bright rim, a long shadow; a slope graded earth and
// grass in steps; a ramp (a slope of a ring with cliffs) bare earth with a track up it and a cairn each side of its top.
// Light from the upper left. A terrace is a raised plateau seen from the south: its top lighter and warmer, a light lip on its rim,
// a cliff of earth or rock in strata along its south edge (9 px a level of the step, inside the higher cells, so a soldier there
// is on the climb), deep at the foot and a cool shadow below; its east wall in shade, its west wall lit, its north edge outlined.
// Woods mix their climate's species with clearings and thickets, on the flat or on a plateau (its cliff still seen: a crown is
// kept off a face); a few lone trees and copses stand in the open; small painted details by climate (flowers, tufts, pebbles, branches, mushrooms; drifts and
// iced rocks; sparse stones and cracked earth; moss and puddles). Desert: bare, no woods (a wood cell gets dry tufts), its marsh or
// marsh an oasis (a pool, a sand bank, green and palms round it). A river (phase 2): deep water darker toward its middle, the
// west and north banks' shade on it, current lines and glints, earth (rock, sand, mud) banks, the far bank's face lit, reeds and
// stones; a ford shallow and light over gravel bars, a line of stepping stones across, foam where it drops into the deep; a bridge
// (wood, or stone in the frost and the hills) across its cells, railed or walled, piles or arches in the water, its shadow on it.
// Frost: a ford is ice (cracked, snow on its edges), deep water runs dark between ice shelves, floes on it. Swamp: murky, weed.
// Readable on a phone (a cell ~10 CSS px). Nothing here collides.
(function(PX){
  /* palettes by climate: base (the arena's 3 tones, for the plain ground), hi/lift (warm light the terraces rise toward, a share a
     level), face (a terrace's cliff, light to deep), lo (cool shade: a cliff's foot), line (a plateau's north edge); woods: under
     (undergrowth), leaf (canopy, light to deep), trunk, species (the mix: [name, share]); marsh: mud, bank, water (light to deep;
     ice in the frost), reed (tip to root), head (cattail), glint; tuft (grass tufts, tip to root); detail (per open cell and per
     wood cell: [kind, chance]); plain (desert: the ground repainted bare); oasis (desert: its marsh an oasis, green); riv (a
     river: w its water, light to deep; ice (frost: a ford frozen, shelves, floes); bed (a ford's gravel); foam; earth (its banks,
     lit to deep: earth, rock, sand, mud); stone and wood (stepping stones, bridges: light to deep); bridge (its bridges' make);
     reeds (a bank's share in reeds)) */
  PX.GROUND_PAL={
    grass:{base:['#466e32','#547e3a','#689246'],hi:'#e6d88a',lift:.15,face:['#a48a62','#7c664a','#56463a','#362e32'],lo:'#1c2c4a',line:'#26402c',under:'#2a4226',leaf:['#7aa04a','#55803a','#386234','#22422c'],trunk:['#6a4a30','#44301e'],
      species:[['oak',.6],['birch',.2],['fir',.2]],mud:'#4c4a2e',bank:'#2e301e',water:['#7a9890','#56767a','#3e5a62'],reed:['#c4b878','#7e8c46','#4a5e30'],head:'#5a3a22',glint:'#d4e4dc',tuft:['#94b456','#62903c','#3e6a2e'],
      detail:[[['tuft',.3],['flower',.1],['pebbles',.05],['bush',.015],['branch',.015]],[['mushroom',.14],['branch',.12],['tuft',.08]]],
      riv:{w:['#86ac9e','#5e8a8a','#46707a','#36586a'],bed:'#b4a472',foam:'#e8f0ea',earth:['#a8865a','#7e6042','#58442e','#3a2e2a'],stone:['#c0baa4','#9a9480','#706c5e','#4a4842'],wood:['#ae8c5a','#8a6a42','#64492e','#3e2e26'],bridge:'wood',reeds:.15},
      rock:{c:['#c6c2b6','#a09d92','#7c7a72','#5c5b5c','#3c3b42'],g:['#7a9644','#5a7a34','#3e5c2c']}},
    frost:{base:['#c0cbda','#d6dee8','#eef3f9'],hi:'#fff6e4',lift:.3,face:['#c4ccda','#8c98b0','#66728e','#4a5272'],lo:'#4a5a80',line:'#6e7e9a',under:'#a8b2c2',leaf:['#5a7a68','#3e5e4e','#2c4a3e','#1e3430'],trunk:['#5e4028','#3a2818'],snow:['#f4f8fc','#d4e0ec'],
      species:[['pine',.75],['bbirch',.25]],mud:'#aebac8',bank:'#7e8ea6',water:['#eaf2f8','#cadcea','#a8c2d8'],reed:['#d8c890','#ac9c6c','#857650'],head:'#6a4a30',glint:'#ffffff',ice:true,tuft:['#d8c890','#ac9c6c','#857650'],
      detail:[[['drift',.1],['tuft',.12],['icerock',.025]],[['branch',.1],['drift',.06]]],
      riv:{w:['#6a8cae','#4a6c90','#36557a','#284262'],ice:['#eef5fb','#c4daec','#9ebcd8','#6e8eb0'],bed:'#a2aebc',foam:'#f6fafd',earth:['#aab2c2','#828a9c','#5e6478','#42465c'],stone:['#ccd0da','#a2a8b6','#767e92','#50566a'],wood:['#a0907a','#7c6c58','#5a4c3e','#3a3230'],bridge:'stone',reeds:.03},
      rock:{c:['#d2d8e4','#a4aabc','#7a8298','#566076','#383e54'],s:['#fafcff','#dce6f2','#b2c2da']}},
    desert:{base:['#c4a258','#d6b668','#e8cc84'],hi:'#fff2c8',lift:.2,face:['#e0b680','#c08e5c','#986a4a','#6a4842'],plain:true,oasis:true,lo:'#583a52',line:'#86603e',under:'#9a8a4c',leaf:['#a4a45c','#7c8442','#5a6430','#3e4826'],trunk:['#7a5434','#4e3420'],
      species:[],mud:'#8e7a4a',bank:'#8a6a3e',water:['#8ac0bc','#5e98a0','#467884'],reed:['#c8c870','#8a9e4a','#5e7034'],head:'#6a4428',glint:'#e6f4f0',green:['#8aa84a','#6a8c3a'],tuft:['#c8b46a','#9a9450','#72703e'],
      detail:[[['tuft',.035],['stones',.025],['crack',.006]],[['tuft',.22]]],
      riv:{w:['#92c8be','#62a0a4','#4a828c','#386870'],bed:'#d8be84',foam:'#f2f6ee',earth:['#f0d89c','#d0ac6c','#a6804e','#78593c'],stone:['#e8d0a0','#c4a474','#94764e','#644c38'],wood:['#c09a64','#9a7448','#6e5034','#46342a'],bridge:'stone',reeds:.1},
      rock:{c:['#f4d6a2','#deae74','#bc8452','#8e5e3e','#603e30'],b:['#c8704a','#f6e0b0','#a0603c']}},
    swamp:{base:['#3a482a','#485834','#5a6a3e'],hi:'#c4c07a',lift:.14,face:['#7a744e','#5c583c','#42402e','#2a2a24'],lo:'#121a2c',line:'#182214',under:'#253020',leaf:['#66703e','#4a5630','#343f26','#20291a'],trunk:['#6a5e4a','#443a2c'],
      species:[['dead',.45],['willow',.35],['oak',.2]],mud:'#353624',bank:'#202216',water:['#56705e','#3e5648','#2c4038'],reed:['#9a9656','#646e38','#3e4a26'],head:'#4a3220',glint:'#9ab8a0',tuft:['#8a8e4c','#5e6a36','#3e4a26'],
      detail:[[['reeds',.1],['moss',.16],['puddle',.04],['tuft',.08]],[['mushroom',.1],['branch',.1],['moss',.1]]],
      riv:{w:['#5a7260','#405848','#2e4238','#20302a'],bed:'#5e5a3a',foam:'#a4b496',earth:['#6a6440','#4e4a30','#363422','#24241a'],stone:['#9a9a80','#76786a','#54584c','#383c34'],wood:['#8e7a56','#6c5a3c','#4c3e2a','#302820'],bridge:'wood',reeds:.22},
      rock:{c:['#8e9080','#6c7064','#50564a','#3a4036','#22281f'],m:['#66763a','#4a5a2c','#34421f']}}
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
  /* the battlefield's standing trees (terrain phase 3): 32×32 sprites, the trunk's base at (16,31), drawn by the game in the same
     depth-sorted list as the soldiers (their shadows and roots stay on the ground). The crown is built of leaf clumps, each lit
     from its own upper left (so it reads as foliage, not a disc), dappled, rimmed in the deepest tone; 3 variants a species. Same
     species as the small ones: oak, birch, fir, pine (snowy tiers), bbirch (bare, snowy boughs), dead (leaning, crooked, mossy),
     willow (low, hanging strands), palm (curved trunk, drooping fronds). Seeded: never Math.random */
  const TREES32={};
  function treeSprite32(clim,sp,v){const k=clim+sp+v;if(TREES32[k])return TREES32[k];const P=PX.GROUND_PAL[clim],S=SPECIES[sp]||{},N=32,R=PX.dice(PX.rng(v*131+sp.length*17+clim.length*11+3)),hs=(x,y,s)=>PX.hash(x,y,v*7+s);
    const L=(S.leaf||P.leaf).map(c=>v===1?PX.shade(c,.9):v===2?PX.mix(c,P.hi,.1):c),TR=S.trunk||P.trunk;
    const cv=PX.canvas(N,N,g=>{const Pt=PX.paint(g),M=new Uint8Array(N*N),set=(x,y,t)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<N&&y<N)M[y*N+x]=t},at=(x,y)=>x>=0&&y>=0&&x<N&&y<N?M[y*N+x]:0;
      // (M: 0 empty, 1-4 leaf light to deep, 5-6 trunk lit and shaded, 7-8 snow lit and shaded, 9 bark mark, 10 trunk mid)
      // clumps [x,y,r]: a pixel takes the last clump it lies in; lit by that clump's upper left, the crown's (cx,cy,cr) a little, dappled
      const clumps=(Cl,cx,cy,cr)=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++){let c=null;for(const q of Cl)if((x+.5-q[0])**2+(y+.5-q[1])**2<=q[2]*q[2])c=q;if(!c)continue;
        const lx=(c[0]-x-.5)*.6+(c[1]-y-.5),lit=lx/c[2]*.9+((cx-x-.5)*.5+(cy-y-.5))/cr*.45+(hs(x>>1,y>>1,1)-.5)*.5+(hs(x,y,2)-.5)*.25;set(x,y,lit>.75?1:lit>.05?2:lit>-.6?3:4)}};
      const trunk=(xc,y0,y1,w,lean=0)=>{for(let y=y0;y<=y1;y++){const o=Math.round((y1-y)*lean),x0=xc-(w>>1)+o;for(let i=0;i<w;i++)set(x0+i,y,i===0?5:i===w-1?6:10);if(y>=y1-1){set(x0-1,y,6);set(x0+w,y,6)}}};
      const line=(x0,y0,x1,y1,t,th=1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n,c=typeof t==='function'?t(i,n):t;set(x,y,c);if(th>1&&i<n*.6)set(x,y+1,c===5?6:c)}};
      // (a cone of tiers: a fir's, a pine's; snow on each tier's top and its lit side)
      const cone=(top,bot,wmax,tier,snow)=>{const o=R.int(0,1);for(let y=top;y<=bot;y++){const k=(y-top)%tier,w=Math.min(wmax,1+(y-top)*.42+o*.4)-(k===tier-1?1.6:k===0&&y>top?.8:0);
        for(let x=0;x<N;x++){const d=x+.5-16;if(Math.abs(d)>w)continue;const e=Math.abs(d)>w-1.3,n=hs(x,y,3);let t=d<-w*.35?2:d<w*.2?(n>.8?1:2):3;if(e)t=d<0?3:4;if(k===tier-1&&n<.5)t=4;if(d<-1&&k<2&&n>.6)t=1;set(x,y,t);
          if(snow&&(k===0||k===1&&d<0||d<-w+1.6)&&n>.25)set(x,y,k===1&&d>0?8:7)}}};
      const o=R.int(-1,1),q=R.int(0,1);
      if(sp==='oak'){trunk(16,17,31,3);line(16,21,10,15,6);line(16,20,23,14,5);
        clumps([[16,18,6],[9+o,15,6],[23+o,14.5,6],[11,9,5.5],[21+o,8.5,5.5],[16+o,6,6+q*.5],[16,13,7.5],[7+o,10,3.5],[25,11,3.5]],15,9,13)}
      else if(sp==='birch'){trunk(16,10,31,2);for(let y=12;y<30;y+=3+(y&1))set(15+(y&1),y,9);line(16,17,11,12,6);
        clumps([[16,15,4.5],[11,13,4.5],[21+o,12,4.5],[16,9,5.5],[13+o,5,4],[19,4.5,4],[16,2.5,3]],15,6,10)}
      else if(sp==='fir'){trunk(16,24,31,2);cone(0,25,11,5,false)}
      else if(sp==='pine'){trunk(16,24,31,2);cone(0,25,11.5,6,true)}
      else if(sp==='bbirch'){trunk(16,4,31,2);for(let y=6;y<30;y+=3)set(15+(y&1),y,9);
        for(const [x0,y0,x1,y1] of [[16,18,5,9],[17,14,27,5],[17,22,27,16],[16,11,9,3],[15,25,6,20],[16,8,20,1]]){line(x0,y0,x1,y1,6);const mx=(x0+x1)/2,my=(y0+y1)/2;line(mx,my,mx+(x1>x0?2:-2),my-4,6);set(x1,y1-1,7);set(x1+(x1>x0?-1:1),y1,7);if(hs(x1,y1,4)>.4)set(mx,my-1,7)}}
      else if(sp==='palm'){const b=v===1?-1:1,top=8;for(let y=top;y<32;y++){const x=16+Math.round(b*(31-y)**2/150);set(x-1,y,(y%3)?5:6);set(x,y,(y%3)?10:6);if(y%3===0)set(x+1,y,6)}
        const cx=16+Math.round(b*(31-top)**2/150),cy=top;
        for(const [ex,ey,dr] of [[-14,4,5],[-9,-6,2],[0,-8,0],[9,-6,2],[14,4,5],[10,9,4],[-10,9,4],[-4,10,3],[5,11,3]]){const n=Math.max(Math.abs(ex),Math.abs(ey))*1.2|0;
          for(let i=0;i<=n;i++){const f=i/n,x=cx+ex*f,y=cy+ey*f+dr*f*f;set(x,y,f<.35?2:f<.75?2+(i&1):3);if(f>.2&&f<.9){set(x+(ey<0?0:0),y+1,3)}}}
        set(cx,cy,1);set(cx-1,cy,1);set(cx+1,cy+1,4);set(cx-1,cy+2,4)}
      else if(sp==='willow'){trunk(16,18,31,3);clumps([[16,13,8],[8,15,6],[24,15,6],[16,7,6],[11,9,4.5],[21,9,4.5]],15,9,12);
        for(let x=2;x<30;x++){if(hs(x,0,5)<.35)continue;let y0=-1;for(let y=N-1;y>=0;y--)if(at(x,y)>=1&&at(x,y)<=4){y0=y;break}if(y0<0)continue;const L=3+Math.floor(hs(x,1,6)*5);for(let k=1;k<=L;k++)set(x,y0+k,k===L?4:3)}}
      else{// dead: a leaning trunk, crooked boughs that fork, moss on their ends
        const lean=v===1?.12:-.12;trunk(16,6,31,3,lean);const tx=y=>16+Math.round((31-y)*lean);
        for(const [y0,x1,y1] of [[18,6,9],[13,26,5],[22,26,15],[9,10,2]]){const x0=tx(y0),mx=(x0+x1)/2+(y1<y0?-1:1),my=(y0+y1)/2-1;line(x0,y0,mx,my,5,2);line(mx,my,x1,y1,6);line(mx,my,mx+(x1>x0?4:-4),my-5,6);
          for(const [x,y] of [[x1,y1],[mx+(x1>x0?4:-4),my-5]]){set(x,y,2);set(x+1,y,3);set(x,y+1,3);set(x-1,y+1,4);if(hs(x,y,7)>.3){set(x,y+2,3);set(x,y+3,4)}}}}
      // the rim: every empty pixel beside leaf or snow, in the deepest leaf tone (the trunk keeps its own edge)
      const rim=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!at(x,y)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const t=at(x+a,y+b);return t&&(t<=4||t===7||t===8)}))rim.push([x,y]);
      for(const [x,y] of rim)set(x,y,4);
      const col=[null,L[0],L[1],L[2],L[3],TR[0],TR[1],P.snow?P.snow[0]:'#f4f8fc',P.snow?P.snow[1]:'#d4e0ec','#3a3430',PX.mix(TR[0],TR[1],.5)];
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){const t=M[y*N+x];if(t)Pt.px(col[t],x,y)}});
    // (its drawn pixels' box: the game fades a tree whose box covers your men)
    {const d=cv.getContext('2d').getImageData(0,0,N,N).data;let x0=N,y0=N,x1=-1,y1=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(d[(y*N+x)*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}cv.box=[x0,y0,x1,y1]}
    return TREES32[k]=cv}
  PX.battleTree=treeSprite32;
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

  PX.ROCK_PX=14;// (a level of a mountain's height, px: spec.rockH × this, unless spec.rockPx)
  PX.battleGround=spec=>{
    const C=spec.C,R=spec.R,cs=spec.cs||16,clim=PX.GROUND_PAL[spec.climate]?spec.climate:'grass',P=PX.GROUND_PAL[clim],seed=(spec.seed|0)||1,base=spec.base,
      W=base?base.width:spec.w||C*cs,H=base?base.height:spec.h||R*cs,kind0=spec.kind||new Uint8Array(C*R),lvl=spec.lvl||new Uint8Array(C*R);
    // (the desert: its marsh is an oasis; woods none. A river, 3-5, wherever the game lays one)
    const kind=kind0,oasis=!!P.oasis,bare=!P.species.length,RP=P.riv,rk=typeof spec.recipe==='string'?spec.recipe:spec.recipe&&spec.recipe.kind||'';
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
    // (1b) a river: its cells' water and depth blurred [1 2 1]² and read through the same wobble, so a bank runs as a curve through
    //      a meander's steps yet sits on its cells' edge. WV: 0 land, 1 ford, 2 deep (a bridge's cells are deep under its deck)
    const hasW=kind.some(k=>k>=3&&k<=5),WV=hasW?new Uint8Array(W*H):null,bil=(A,iu,iv,fu,fv)=>{const a=cell(A,iu,iv),b=cell(A,iu+1,iv),c=cell(A,iu,iv+1),d=cell(A,iu+1,iv+1);return a+(b-a)*fu+(c-a)*fv+(a-b-c+d)*fu*fv};
    const blur=f=>{const A=new Float32Array(C*R);for(let j=0;j<R;j++)for(let i=0;i<C;i++){let s=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)s+=f(cell(kind,i+a,j+b))*(a?1:2)*(b?1:2);A[j*C+i]=s/16}return A};
    const WB=hasW?blur(k=>k>=3&&k<=5?1:0):null,DB=hasW?blur(k=>k===4||k===5?1:0):null;// (6, rock, is no water)
    each((x,y,o)=>{const jx=(NX(x,y)-.5)*7,jy=(NY(x,y)-.5)*7,sx=x+.5+jx,sy=y+.5+jy,u=sx/cs-.5,v=sy/cs-.5,iu=Math.floor(u),iv=Math.floor(v),fu=u-iu,fv=v-iv;
      const a=cell(lvl,iu,iv),b=cell(lvl,iu+1,iv),c=cell(lvl,iu,iv+1),d=cell(lvl,iu+1,iv+1),h=a+(b-a)*fu+(c-a)*fv+(a-b-c+d)*fu*fv;T[o]=h>=1.5?2:h>=.5?1:0;
      if(hasW){const wu=(x+.5+jx*.6)/cs-.5,wv=(y+.5+jy*.6)/cs-.5,ku=Math.floor(wu),kv=Math.floor(wv);if(bil(WB,ku,kv,wu-ku,wv-kv)>.5){WV[o]=bil(DB,ku,kv,wu-ku,wv-kv)>.5?2:1;return}}
      const qu=(sx+(PX.hash(x,y,seed+2)-.5)*3)/cs-.5,qv=(sy+(PX.hash(x,y,seed+3)-.5)*3)/cs-.5,ku=Math.floor(qu),kv=Math.floor(qv),wu=qu-ku,wv=qv-kv;
      const k0=cell(kind,ku,kv),k1=cell(kind,ku+1,kv),k2=cell(kind,ku,kv+1),k3=cell(kind,ku+1,kv+1),w0=(1-wu)*(1-wv),w1=wu*(1-wv),w2=(1-wu)*wv,w3=wu*wv;
      const s1=(k0===1?w0:0)+(k1===1?w1:0)+(k2===1?w2:0)+(k3===1?w3:0);if(s1>.5){K[o]=1;return}const s2=(k0===2?w0:0)+(k1===2?w1:0)+(k2===2?w2:0)+(k3===2?w3:0);if(Q)Q[o]=s2+(NP(x,y)-.5)*.14;if(s2>.5)K[o]=2});
    // (2) marsh pools: a blotchy noise over the marsh, kept a few pixels inside it; an oasis: one pool in its heart
    const Kat=(x,y)=>x<0||y<0||x>=W||y>=H?0:K[y*W+x];
    each((x,y,o)=>{if(oasis){const q=Q[o];if(q>.88)WT[o]=q>.95?2:1;return}if(K[o]!==2)return;const n=NP(x,y)*.8+NQ(x,y)*.2;if(n>.6&&Kat(x,y-4)===2&&Kat(x,y+4)===2&&Kat(x-5,y)===2&&Kat(x+5,y)===2)WT[o]=n>.68?2:1});
    // (1c) the river's reach: each water pixel's distance to land (DW) and each land pixel's to water (DL), chamfer 3-4 (3 a px),
    //      in its cells' box; which way it flows (down the field, or across: flowV) and its middle's slope a row (the current's lean)
    let DW=null,DL=null,flowV=true,bx0=0,by0=0,bx1=0,by1=0;const SLP=new Float32Array(Math.max(C,R));
    if(hasW){let c0=C,c1=-1,r0=R,r1=-1,nr=0,nc=0;const rows=new Float32Array(R),rn=new Uint16Array(R),cols=new Float32Array(C),cn=new Uint16Array(C);
      for(let j=0;j<R;j++)for(let i=0;i<C;i++)if(kind[j*C+i]>=3&&kind[j*C+i]<=5){if(i<c0)c0=i;if(i>c1)c1=i;if(j<r0)r0=j;if(j>r1)r1=j;rows[j]+=i;rn[j]++;cols[i]+=j;cn[i]++}
      for(let j=0;j<R;j++)if(rn[j])nr++;for(let i=0;i<C;i++)if(cn[i])nc++;flowV=nr>=nc;
      const L=flowV?R:C,cnt=flowV?rn:cn,sum=flowV?rows:cols,mid=k=>{for(let d=0;d<L;d++){if(k-d>=0&&cnt[k-d])return sum[k-d]/cnt[k-d];if(k+d<L&&cnt[k+d])return sum[k+d]/cnt[k+d]}return 0};
      for(let k=0;k<L;k++)SLP[k]=(mid(k+1)-mid(k-1))/2;
      bx0=Math.max(0,(c0-1)*cs);by0=Math.max(0,(r0-1)*cs);bx1=Math.min(W,(c1+2)*cs);by1=Math.min(H,(r1+2)*cs);
      const cham=src=>{const A=new Uint16Array(W*H).fill(999);
        for(let y=by0;y<by1;y++)for(let x=bx0;x<bx1;x++){const i=y*W+x;if(src(i)){A[i]=0;continue}let m=A[i];if(x>bx0)m=Math.min(m,A[i-1]+3);if(y>by0){m=Math.min(m,A[i-W]+3);if(x>bx0)m=Math.min(m,A[i-W-1]+4);if(x<bx1-1)m=Math.min(m,A[i-W+1]+4)}A[i]=m}
        for(let y=by1-1;y>=by0;y--)for(let x=bx1-1;x>=bx0;x--){const i=y*W+x;let m=A[i];if(!m)continue;if(x<bx1-1)m=Math.min(m,A[i+1]+3);if(y<by1-1){m=Math.min(m,A[i+W]+3);if(x<bx1-1)m=Math.min(m,A[i+W+1]+4);if(x>bx0)m=Math.min(m,A[i+W-1]+4)}A[i]=m}
        return A};
      DW=cham(i=>!WV[i]);DL=cham(i=>WV[i]>0)}
    // (Wv: the river at a pixel, 255 off the field; dn, upw: k px down or up its flow; Dl: a pixel's distance to it, chamfer units)
    const Wv=(x,y)=>x<0||y<0||x>=W||y>=H?255:WV[y*W+x],dn=(x,y,k)=>flowV?Wv(x,y+k):Wv(x+k,y),upw=(x,y,k)=>flowV?Wv(x,y-k):Wv(x-k,y),Dl=(x,y)=>!hasW||x<0||y<0||x>=W||y>=H?999:DL[y*W+x];
    const Wat=(x,y)=>x<0||y<0||x>=W||y>=H?0:WT[y*W+x],Tat=(x,y)=>x<0||y<0||x>=W||y>=H?0:T[y*W+x],Fat=(x,y)=>x<0||y<0||x>=W||y>=H?1:F[y*W+x];
    const FH=9,FC=P.face.map(hx),HI=hx(P.hi),LO=hx(P.lo),LN=hx(P.line),UN=hx(P.under),LF=hx(P.leaf[2]),MU=hx(P.mud),BK=hx(P.bank),WA=P.water.map(hx),GR=(P.green||P.leaf).map(hx);
    const FOOT=[.62,.5,.4,.3,.2,.1],mix=(o,c,t)=>{D[o]+=(c[0]-D[o])*t;D[o+1]+=(c[1]-D[o+1])*t;D[o+2]+=(c[2]-D[o+2])*t},put=(o,c)=>{D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2]};
    // the river's own colours (RW: its water light to deep; DEEP: the deep's tones by depth; FORD: shallow over gravel; BEDL: a bar)
    const RW=RP.w.map(hx),BED=hx(RP.bed),FOAM=hx(RP.foam),E=RP.earth.map(hx),ICE=RP.ice?RP.ice.map(hx):null,SN=hx('#f4f8fc'),ST=RP.stone.map(hx),WEED=hx('#5e6e34');
    const lerp=(a,b,t)=>a.map((v,z)=>v+(b[z]-v)*t),DEEP=[lerp(RW[0],RW[1],.55),RW[1],RW[2],RW[3]],FORD=lerp(RW[0],BED,.42),BEDL=lerp(BED,hx(P.hi),.25),NB=hasW?noise(W,H,12,seed+60):null;
    // a river's pixel: w 1 ford, 2 deep; d its distance to land (px)
    const water=(o,x,y,i,w)=>{const d=DW[i]/3,h=PX.hash(x,y,seed+61),nb=NB(x,y);
      if(w===1){if(ICE){put(o,ICE[nb>.66?0:nb<.3?2:1]);if(h>.97)put(o,ICE[0]);else if(h<.02)put(o,ICE[2]);if(d<1.6){put(o,ICE[0]);return}// (a frozen ford: snow on its edge)
          for(let k=1;k<=2;k++){if(dn(x,y,k)===2){put(o,k===1?ICE[3]:ICE[0]);return}if(k===1&&upw(x,y,1)===2){put(o,ICE[2]);return}}return}
        put(o,FORD);if(nb>.64){put(o,BEDL);if(h<.1)put(o,ST[1]);else if(h>.93)put(o,ST[0])}else if(nb<.38)mix(o,RW[1],.3);// (gravel bars, deeper runs)
        if(d<1.6){put(o,BEDL);return}
        for(let k=1;k<=2;k++){if(dn(x,y,k)===2){put(o,h>.22?FOAM:RW[0]);return}if(k===1&&upw(x,y,1)===2){put(o,RW[1]);return}}// (foam where it drops into the deep)
        if(PX.hash(x>>2,y,seed+62)<.05&&h>.3)mix(o,FOAM,.6);return}// (riffles)
      // the deep: on a frozen river ice shelves along its edges; else darker toward its middle, the west and north banks' shade on it,
      // a lit wet edge on the east and south, churn below a ford
      if(ICE){const sw=1.5+NQ(x,y)*4;if(d<sw-1){put(o,ICE[d<1.5?0:1]);if(h<.05)put(o,ICE[2]);return}if(d<sw){put(o,ICE[3]);return}}
      const dd=d+(NP(x,y)-.5)*4+(h-.5)*1.2;put(o,DEEP[dd<2.5?0:dd<7?1:dd<13?2:3]);if(clim==='swamp'&&nb>.7&&d>2.5)mix(o,WEED,.32+(h>.8?.2:0));
      let s=0;for(let k=1;k<=3&&!s;k++)if(Wv(x-k,y)===0||Wv(x,y-k)===0)s=k;
      if(s)mix(o,LO,.48-.12*s);else if(Wv(x+1,y)===0||Wv(x,y+1)===0)mix(o,RW[0],.6);else if(Wv(x+2,y)===0)mix(o,RW[0],.3);
      for(let k=1;k<=5;k++)if(upw(x,y,k)===1){if(h<.55-.1*k)put(o,h<.2?FOAM:RW[0]);break}};
    // a bank's pixel, within 3 px of the water: the far bank's face toward us (a lit lip), the west bank's turned from the light, the
    // east bank's toward it, the near bank's lip; false: none (the ground painted as ever)
    const bank=(o,x,y,dl)=>{const h=PX.hash(x,y,seed+63),near=(a,b)=>{for(let k=1;k<=3;k++){const v=Wv(x+a*k,y+b*k);if(v&&v!==255)return k}return 0},s=near(0,1),e=near(1,0),wst=near(-1,0),n=near(0,-1);
      if(s){put(o,E[s===1?2:s===2?1:0]);if(s===3){mix(o,HI,.3);if(ICE&&h>.2)put(o,SN)}}
      else if(e){put(o,E[e===1?3:e===2?2:1]);mix(o,LO,.12)}
      else if(wst){put(o,E[wst===1?1:0]);if(wst===3&&ICE&&h>.3)put(o,SN)}
      else if(n){if(n>2)return false;put(o,E[n===1?2:1])}
      else{if(dl>=2)return false;mix(o,E[1],.6)}
      if(h>.94)put(o,E[0]);else if(h<.04)put(o,E[3]);return true};
    // (phase 4) cliffs and slopes. With spec.wall (edge bits E 1, S 2, W 4, N 8: a step refused over that edge), an edge with a bit
    // on either side is a sheer cliff: rock, FHS px a level, dark, cracked, a bright rim, a long shadow at its foot, a thick dark lip
    // on the north; one with none is a slope: graded earth and grass in steps, a soft foot. On a plateau with any cliff a slope is its
    // ramp: a track up it, a stone each side of its top (paintRamps). No spec.wall: every edge as before (a face, climbable)
    const WL=spec.wall&&spec.wall.length===C*R?spec.wall:null,FHS=12,RC=(P.rock||PX.GROUND_PAL.grass.rock).c.map(hx),FOOTS=[.7,.62,.54,.46,.38,.3,.2,.1],FOOTL=[.34,.22,.11,.04];
    let edgeK=null,kindOf=null;
    if(WL){const wb=(i,j)=>i<0||j<0||i>=C||j>=R?0:WL[j*C+i],P1=new Int16Array(C*R).fill(-1),P2=new Int16Array(C*R).fill(-1),W1=[],W2=[];
      // (the rings: each part of the ground at level th or more, and whether any edge of it down to lower ground is a cliff)
      const ring=(PL,WD,th)=>{for(let q0=0;q0<C*R;q0++){if(lvl[q0]<th||PL[q0]>=0)continue;const id=WD.length,st=[q0];PL[q0]=id;let w=0;
        while(st.length){const q=st.pop(),i=q%C,j=(q-i)/C;for(const [a,c,b,ob] of [[1,0,1,4],[-1,0,4,1],[0,1,2,8],[0,-1,8,2]]){const x=i+a,y=j+c;if(x<0||y<0||x>=C||y>=R)continue;const n=y*C+x;
          if(lvl[n]>=th){if(PL[n]<0){PL[n]=id;st.push(n)}}else if((WL[q]&b)||(WL[n]&ob))w=1}}WD.push(w)}};
      ring(P1,W1,1);ring(P2,W2,2);
      // an edge of cell (i,j) toward b (it the higher): 1 sheer, 2 a ramp (a slope in a ring with cliffs), 0 a slope
      kindOf=(i,j,b)=>{const a=b===1?1:b===4?-1:0,c=b===2?1:b===8?-1:0,ob=b===1?4:b===4?1:b===2?8:2;if((wb(i,j)&b)||(wb(i+a,j+c)&ob))return 1;
        const th=lvl[(j+c)*C+i+a]+1,p=(th>=2?P2:P1)[j*C+i];return p>=0&&(th>=2?W2:W1)[p]?2:0};
      // the cell edge under a terrace pixel boundary: (x,y) the first lower pixel past it, b the way from the plateau to it; the
      // nearest cell line (and column, or row) where the cells do step down that way (the boundary wobbles ±3.5 px)
      const IN=(i,j)=>i>=0&&j>=0&&i<C&&j<R;
      edgeK=(b,x,y)=>{const i0=Math.floor(x/cs),j0=Math.floor(y/cs);
        if(b===2||b===8){const L0=Math.round((b===2?y:y+1)/cs),i1=i0+(x-i0*cs<8?-1:1);for(const L of [L0,L0-1,L0+1])for(const i of [i0,i1]){const hi=b===2?L-1:L,lo=b===2?L:L-1;if(IN(i,hi)&&IN(i,lo)&&lvl[hi*C+i]>lvl[lo*C+i])return kindOf(i,hi,b)}}
        else{const L0=Math.round((b===1?x:x+1)/cs),j1=j0+(y-j0*cs<8?-1:1);for(const L of [L0,L0-1,L0+1])for(const j of [j0,j1]){const hi=b===1?L-1:L,lo=b===1?L:L-1;if(IN(hi,j)&&IN(lo,j)&&lvl[j*C+hi]>lvl[j*C+lo])return kindOf(hi,j,b)}}
        return 0}}
    const TU=P.tuft.map(hx),RB=P.rock&&P.rock.b?P.rock.b.map(hx):null,SNW=P.rock&&P.rock.s?P.rock.s.map(hx):null;
    // a plateau pixel with walls known: its south face (sheer: rock in FHS-px levels; a slope: graded, in steps), the rim over it,
    // its east wall (sheer 4 px a level, else 3) and west (2, else 1), its north lip; true: painted
    const wlTop=(o,x,y,i,t,d1,st)=>{
      if(d1){const ek=edgeK(2,x,y+d1),sh=ek===1,fh=(sh?FHS:FH)*st;
        if(d1<=fh){const f=(fh-d1)/(fh-1),h=PX.hash(x,y,seed+12);
          if(sh){F[i]=1;let k=f<.1?1:f<.4?2:f<.75?3:4;const led=(d1+((x>>4)&1)*2)%5===0&&h>.25;
            if(PX.hash(x,(y+d1)>>4,seed+14)<.16&&PX.hash(x,y>>2,seed+15)<.8)k=Math.min(4,k+1);else if(led&&k>1)k--;// (cracks down it, ledges across)
            put(o,RC[k]);if(RB){const bd=Math.floor((d1+((x>>3)&1))/3)%3;mix(o,RB[bd],bd===1?.18:.3)}
            if(SNW&&led&&h>.45)put(o,SNW[f<.5?0:1]);if(h>.96)put(o,RC[Math.max(0,k-1)]);
            if(d1===fh){put(o,RC[0]);mix(o,HI,.5)}else if(d1===fh-1)put(o,RC[1]);return true}
          // (a slope: steps of earth graded toward its foot; a ramp's browner, bare)
          F[i]=4;mix(o,LO,.06+.26*f);if(ek===2)mix(o,FC[0],.3);const s=(d1+((x>>2)&1))%3;if(s===0)mix(o,FC[ek===2?2:1],ek===2?.5:.45);else if(s===1)mix(o,HI,.18);if(h>.95&&ek!==2)put(o,TU[1]);return true}
        if(d1<=fh+2){mix(o,HI,sh?(d1===fh+1?.75:.35):(d1===fh+1?.22:.08));return true}}
      for(let d=1;d<=8;d++){const u=Tat(x+d,y);if(u<t){const sh=edgeK(1,x+d,y)===1;if(d<=(sh?4:3)*(t-u)){if(sh){F[i]=2;put(o,RC[d===1?4:3]);if(PX.hash(x,y,seed+13)>.9)put(o,RC[2])}else{F[i]=4;mix(o,LO,.3-.06*d)}return true}break}}
      for(let d=1;d<=4;d++){const u=Tat(x-d,y);if(u<t){const sh=edgeK(4,x-d,y)===1;if(d<=(sh?2:1)*(t-u)){if(sh){F[i]=2;put(o,RC[d===1?1:2])}else{F[i]=4;mix(o,HI,.2)}return true}break}}
      if(Tat(x,y-1)<t){if(edgeK(8,x,y-1)===1){put(o,RC[1]);mix(o,HI,.3)}else mix(o,HI,.3);return true}
      if(Tat(x-1,y)<t){mix(o,HI,.25);return true}
      return false};
    // a pixel below or beside a higher one, walls known: the shadow at a cliff's foot (long) or a slope's (soft), east of a wall, a
    // north edge's outline (a cliff's thick and dark, a slope's faint)
    const wlLow=(o,x,y,t)=>{
      for(let d=1;d<=8;d++)if(Tat(x,y-d)>t){const A=edgeK(2,x,y-d+1)===1?FOOTS:FOOTL;if(d<=A.length)mix(o,LO,A[d-1]);return}
      for(let d=1;d<=3;d++)if(Tat(x-d,y)>t){if(edgeK(1,x-d+1,y)===1)mix(o,LO,.5-.1*d);else if(d===1)mix(o,LO,.18);return}
      if(Tat(x,y+1)>t){if(edgeK(8,x,y)===1)put(o,LN);else mix(o,LN,.42);return}
      if(Tat(x,y+2)>t){if(edgeK(8,x,y+1)===1)mix(o,LN,.75);return}
      if(Tat(x,y+3)>t&&edgeK(8,x,y+2)===1)mix(o,LN,.4)};
    // a ramp's track (each cluster of ramp edges facing one way: cells touching, a step of the rim allowed): up a south slope a
    // switchback of trodden earth from below its foot onto its top, the foot's earth spilling onto the ground below; across an
    // east, west or north edge a straight track; worn in steps; a cairn each side of its top, so a plateau ringed by cliffs shows
    // its way up at a glance
    function paintRamps(){const TK=lerp(FC[0],HI,.18),TM=lerp(lerp(FC[0],HI,.18),FC[1],.4),TE=FC[2],on=new Uint8Array(W*H),CA=[];
      // (a stroke 4-5 px wide; d: its steps run across rows (1) or columns (2))
      const stroke=(x0,y0,x1,y1,d,r=2.2)=>{const n=Math.ceil(Math.hypot(x1-x0,y1-y0))*2+1;for(let k=0;k<=n;k++){const cx=x0+(x1-x0)*k/n,cy=y0+(y1-y0)*k/n;
        for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++)if((x+.5-cx)**2+(y+.5-cy)**2<=r*r&&x>=0&&y>=16&&x<W&&y<H)on[y*W+x]=d}};
      for(const [b,a,c] of [[2,0,1],[8,0,-1],[1,1,0],[4,-1,0]]){const E=new Uint8Array(C*R),seen=new Uint8Array(C*R);
        for(let j=0;j<R;j++)for(let i=0;i<C;i++)if(i+a>=0&&j+c>=0&&i+a<C&&j+c<R&&lvl[j*C+i]>lvl[(j+c)*C+i+a]&&kindOf(i,j,b)===2)E[j*C+i]=1;
        for(let q0=0;q0<C*R;q0++){if(!E[q0]||seen[q0])continue;const st=[q0];seen[q0]=1;let i0=C,i1=-1,j0=R,j1=-1,t=0,lo=9;
          while(st.length){const q=st.pop(),i=q%C,j=(q-i)/C;i0=Math.min(i0,i);i1=Math.max(i1,i);j0=Math.min(j0,j);j1=Math.max(j1,j);t=Math.max(t,lvl[q]);lo=Math.min(lo,lvl[(j+c)*C+i+a]);
            for(let v=-1;v<=1;v++)for(let u=-1;u<=1;u++){const x=i+u,y=j+v,n=y*C+x;if(x>=0&&y>=0&&x<C&&y<R&&E[n]&&!seen[n]){seen[n]=1;st.push(n)}}}
          const fh=FH*(t-lo);
          if(b===2){const X0=i0*cs,w=(i1-i0+1)*cs,yb=x=>{x=Math.round(x);for(let y=(j0+1)*cs-8;y<(j1+1)*cs+12;y++)if(Tat(x,y)<t)return y;return(j1+1)*cs};
            for(let x=X0+2;x<X0+w-2;x++){const y0=yb(x);for(let r=0;r<6;r++){const y=y0+r;if(y<H)mix((y*W+x)*4,FC[0],.3*(1-r/6))}}
            const xa=X0+w*.28,xb=X0+w*.72,xc=X0+w*.34;stroke(xa,yb(xa)+7,xb,yb(xb)-fh*.45,1);stroke(xb,yb(xb)-fh*.45,xc,yb(xc)-fh-6,1);CA.push([xc-9,yb(xc)-fh-4],[xc+6,yb(xc)-fh-4])}
          else if(b===8){const xc=Math.round((i0+i1+1)/2*cs);let Y=j0*cs;for(let y=j1*cs+8;y>j0*cs-12;y--)if(Tat(xc,y)<t){Y=y+1;break}stroke(xc,Y-12,xc,Y+10,1);CA.push([xc-9,Y+10],[xc+6,Y+10])}
          else{const yc=Math.round((j0+j1+1)/2*cs),s=b===1?-1:1;let X=(b===1?i1+1:i0)*cs;
            if(b===1){for(let x=(i0+1)*cs-8;x<(i1+1)*cs+12;x++)if(Tat(x,yc)<t){X=x;break}}else{for(let x=i1*cs+8;x>i0*cs-12;x--)if(Tat(x,yc)<t){X=x+1;break}}
            stroke(X-s*12,yc,X+s*10,yc,2);CA.push([X+s*10-(s<0?2:1),yc-6],[X+s*10-(s<0?2:1),yc+9])}}}
      for(let q=0;q<W*H;q++){const d=on[q];if(!d)continue;const x=q%W,y=(q-x)/W;put(q*4,(d===1?y:x)%3===0&&PX.hash(x,y,seed+17)<.6||PX.hash(x,y,seed+18)<.08?TM:TK);F[q]=4;
        for(const e of [q+W,q+1])if(e<W*H&&!on[e]){mix(e*4,TE,.45);F[e]=4}}
      // (a cairn each side of the top: stones 3 wide and 4 high, rimmed dark, its shadow to the right)
      for(let [x,y] of CA){x=Math.round(x);y=Math.round(y);if(x<2||y<21||x>W-6||y>=H-2)continue;const pp=(u,v,c)=>{const q=v*W+u;put(q*4,c);F[q]=4};
        for(let v=-4;v<=1;v++)for(let u=-1;u<=3;u++){const ins=u>=0&&u<=2&&v>=-3&&v<=0;if(!ins&&(v===-4&&(u<0||u>2)||v===1&&(u<0||u>2)))continue;
          pp(x+u,y+v,ins?RC[v===-3?(u===2?1:0):v===-2?(u===0?0:u===1?1:2):v===-1?(u===0?1:u===1?2:3):(u===0?2:3)]:RC[4])}
        for(let v=-2;v<=1;v++)mix(((y+v)*W+x+4)*4,LO,.45);mix(((y+2)*W+x+1)*4,LO,.4);mix(((y+2)*W+x+2)*4,LO,.4)}}
    /* mountains and spires (phase 4: kind 6, impassable; spec.rockH a cell's height in levels of spec.rockPx px, ROCK_PX unless
       given; a rock cell without one is 3). Each mass (rock cells joined edge to edge) is a heightfield over its footprint (its cells
       through the same wobble): steep at its edge (a lone spire of 1-2 cells a needle), peaked by a ridged noise, the desert's
       sandstone flat-topped and sheer. Drawn front to back a column at a time, each ground point (x,y) at height z showing at
       (x,y-z), so its peaks rise up the screen over the ground behind it; half-Lambert lit from the upper left, darker toward its
       foot, cast shadows (its own, and on the ground to the lower right), scree at its foot, an outline round its silhouette and
       along each crest over the rock behind; by climate grass tufts and lichen (granite), snow above a ragged line and on its flats
       (frost), strata of ochre and red (desert), moss (swamp). Its pixels are F 3 (nothing stands there) and are returned as props
       (dk 3, run by run of one mass), drawn in depth order with the soldiers as the faces are. Returns RS: each pixel's mass (+1) */
    function rockMasses(){const RH=spec.rockH,RPX=spec.rockPx||PX.ROCK_PX,lab=new Int16Array(C*R).fill(-1),M=[],hOf=q=>RH&&RH[q]||3,desert=clim==='desert';
      for(let q0=0;q0<C*R;q0++){if(kind[q0]!==6||lab[q0]>=0)continue;const id=M.length,m={c0:C,c1:-1,r0:R,r1:-1,n:0,zmax:0},st=[q0];lab[q0]=id;
        while(st.length){const q=st.pop(),i=q%C,j=(q-i)/C;m.n++;if(i<m.c0)m.c0=i;if(i>m.c1)m.c1=i;if(j<m.r0)m.r0=j;if(j>m.r1)m.r1=j;
          for(const [a,c] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+c,n=y*C+x;if(x>=0&&y>=0&&x<C&&y<R&&kind[n]===6&&lab[n]<0){lab[n]=id;st.push(n)}}}M.push(m)}
      const ZR=new Float32Array(W*H),MR=new Uint16Array(W*H),RS=new Uint16Array(W*H),GY=new Int16Array(W*H),NR1=noise(W,H,15,seed+80),NR2=noise(W,H,7,seed+81),NT=noise(W,H,5,seed+82);
      let rx0=W,rx1=0,ry0=H,ry1=0,zm=0;
      // (1) each mass's footprint (its cells, and their heights, on a small grid a cell bigger each side, read through the wobble), its
      //     distance in from the edge (chamfer 3-4) and its height
      M.forEach((m,id)=>{const x0=Math.max(0,m.c0*cs-6),x1=Math.min(W,(m.c1+1)*cs+6),y0=Math.max(0,m.r0*cs-6),y1=Math.min(H,(m.r1+1)*cs+6),bw=x1-x0,bh=y1-y0;
        const small=m.n<=2,A=new Uint16Array(bw*bh),HV=new Float32Array(bw*bh),gi0=m.c0-1,gj0=m.r0-1,gw=m.c1-m.c0+3,gh=m.r1-m.r0+3,GI=new Float32Array(gw*gh),GH=new Float32Array(gw*gh);
        for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const ci=gi0+i,cj=gj0+j;if(ci>=0&&cj>=0&&ci<C&&cj<R&&lab[cj*C+ci]===id){GI[j*gw+i]=1;GH[j*gw+i]=hOf(cj*C+ci)}}
        for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const u=(x+.5+(NX(x,y)-.5)*5)/cs-.5-gi0,v=(y+.5+(NY(x,y)-.5)*5)/cs-.5-gj0,iu=Math.floor(u),iv=Math.floor(v);if(iu<0||iv<0||iu>=gw-1||iv>=gh-1)continue;
          const fu=u-iu,fv=v-iv,o=iv*gw+iu,a=GI[o],b=GI[o+1],c=GI[o+gw],d=GI[o+gw+1],w=a+(b-a)*fu+(c-a)*fv+(a-b-c+d)*fu*fv;
          if(w>.42){const e=GH[o],f=GH[o+1],g=GH[o+gw],h=GH[o+gw+1],k=(y-y0)*bw+x-x0;A[k]=999;HV[k]=(e+(f-e)*fu+(g-e)*fv+(e-f-g+h)*fu*fv)/w}}
        for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){const k=y*bw+x;if(!A[k])continue;A[k]=Math.min(A[k],x?A[k-1]+3:3,y?A[k-bw]+3:3,x&&y?A[k-bw-1]+4:4,y&&x<bw-1?A[k-bw+1]+4:4)}
        for(let y=bh-1;y>=0;y--)for(let x=bw-1;x>=0;x--){const k=y*bw+x;if(!A[k])continue;A[k]=Math.min(A[k],x<bw-1?A[k+1]+3:3,y<bh-1?A[k+bw]+3:3,x<bw-1&&y<bh-1?A[k+bw+1]+4:4,y<bh-1&&x?A[k+bw-1]+4:4)}
        // (a massif's peaks: cones on some of its cells, a cell and a half apart or more, each as high as its cell, the first the
        //  highest, its flanks fluted into three to five ridges by angle; the mass the highest of them over a low body, steep at its
        //  edge. Reckoned on a 2-px lattice (PZ) and read between)
        let PZ=null,pw=0;if(!small&&!desert){const Rk=PX.dice(PX.rng(seed*13+id*101+7)),cand=[],PK=[];for(let j=m.r0;j<=m.r1;j++)for(let i=m.c0;i<=m.c1;i++)if(lab[j*C+i]===id)cand.push([i,j]);
          for(let k=cand.length-1;k>0;k--){const r=Rk.int(0,k),t=cand[k];cand[k]=cand[r];cand[r]=t}
          cand.sort((a,b)=>hOf(b[1]*C+b[0])-hOf(a[1]*C+a[0]));
          for(const [i,j] of cand){if(PK.length>=Math.max(2,Math.round(m.n/5)))break;const px=(i+.5)*cs+Rk.int(-5,5),py=(j+.5)*cs+Rk.int(-5,5);if(PK.some(p=>Math.hypot(p.x-px,p.y-py)<cs*1.6))continue;
            const f=Rk.R()*6.28;PK.push({x:px,y:py,h:hOf(j*C+i)*RPX*(PK.length?.68+.3*Rk.R():1),s:.85+.55*Rk.R(),n:3+Rk.int(0,2),cf:Math.cos(f),sf:Math.sin(f)})}
          pw=(bw>>1)+2;const ph=(bh>>1)+2;PZ=new Float32Array(pw*ph);
          for(let j=0;j<ph;j++)for(let i=0;i<pw;i++){const x=x0+2*i,y=y0+2*j;let z=0;for(const p of PK){const dx=x-p.x,dy=(y-p.y)*1.15,r=Math.sqrt(dx*dx+dy*dy);if(p.h-p.s*r*.68<=z)continue;
            // (cos(n·a+f) from the direction's cosine and sine: no trig)
            const c=r?dx/r:1,s=r?dy/r:0,c2=c*c,s2=s*s,cn=p.n===3?c*(4*c2-3):p.n===4?8*c2*c2-8*c2+1:c*(16*c2*c2-20*c2+5),sn=p.n===3?s*(3-4*s2):p.n===4?4*s*c*(c2-s2):s*(16*s2*s2-20*s2+5);
            const q=p.h-p.s*r*(1+.32*(cn*p.cf-sn*p.sf));if(q>z)z=q}PZ[j*pw+i]=z}}
        for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const k=(y-y0)*bw+x-x0;if(!A[k])continue;const d=A[k]/3,rid=1-Math.abs(2*NR1(x,y)-1),cr=NR2(x,y)-.5,Hp=HV[k]*RPX;let z;
          if(desert)z=Math.min(Hp*(.95+.05*rid)+cr*1.5,d*(small?9:6));// (sandstone: a butte or a mesa, flat on top, sheer)
          else if(small)z=Math.min(Hp*(.82+.18*rid)*(1+cr*.3),d*6);// (a spire: a needle)
          else{const u=(x-x0)/2,v=(y-y0)/2,iu=u|0,iv=v|0,fu=u-iu,fv=v-iv,o=iv*pw+iu,a=PZ[o],b=PZ[o+1],c=PZ[o+pw],e=PZ[o+pw+1];
            z=Math.max(Hp*.3*Math.min(1,d/12),a+(b-a)*fu+(c-a)*fv+(a-b-c+e)*fu*fv);z=Math.min(z*(1+cr*.12)+rid*2,d*(2+1.6*NR2(x+57,y+31)))}
          z=Math.max(.6,z);const p=y*W+x;if(z>ZR[p]){ZR[p]=z;MR[p]=id+1}if(z>m.zmax)m.zmax=z}
        m.b=[x0,y0,x1,y1];if(x0<rx0)rx0=x0;if(x1>rx1)rx1=x1;if(y0<ry0)ry0=y0;if(y1>ry1)ry1=y1;if(m.zmax>zm)zm=m.zmax});
      // (each column's rows holding rock: its masses' boxes)
      const CY0=new Int16Array(W).fill(H),CY1=new Int16Array(W);for(const m of M)for(let x=m.b[0];x<m.b[2];x++){if(m.b[1]<CY0[x])CY0[x]=m.b[1];if(m.b[3]>CY1[x])CY1[x]=m.b[3]}
      const SK=1.6,LSX=-.92,LSY=-.38,K=Math.ceil(zm/SK)+1,LX=-.6,LY=0,LZ=.8,LN_=Math.hypot(LX,LY,LZ);
      // (in the rock's shadow: a march toward the light over ZR, st px a step; bx, by: the rock's box's west and north edges)
      const shadowed=(x,y,z0,st=1,bx=0,by=0)=>{for(let k=2;k<=K;k+=st){const qx=Math.round(x+LSX*k),qy=Math.round(y+LSY*k);if(qx<bx||qy<by||qx>=W||qy>=H)return false;if(ZR[qy*W+qx]>z0+k*SK)return true}return false};
      // (the small map: the ground's colour, by cell, where the rock will stand over it)
      const cy0=Math.max(0,Math.floor((ry0-zm)/cs)),cy1=Math.min(R-1,Math.floor(ry1/cs)),cx0=Math.floor(rx0/cs),cx1=Math.min(C-1,Math.floor((rx1-1)/cs)),UND=new Float32Array(C*R*3).fill(-1);
      for(let j=cy0;j<=cy1;j++)for(let i=cx0;i<=cx1;i++){let s0=0,s1=0,s2=0,n=0;for(let y=j*cs+1;y<Math.min(H,(j+1)*cs);y+=2)for(let x=i*cs+1;x<Math.min(W,(i+1)*cs);x+=2){const o=(y*W+x)*4;s0+=D[o];s1+=D[o+1];s2+=D[o+2];n++}if(n){UND[(j*C+i)*3]=s0/n;UND[(j*C+i)*3+1]=s1/n;UND[(j*C+i)*3+2]=s2/n}}
      // (2) on the ground: scree round each foot (stones, tufts, drifts), its contact shade, the masses' shadows to the lower right
      //     (tested on a 2-px lattice)
      const GT=P.rock.g?P.rock.g.map(hx):TU,DN=new Uint8Array(W*H),NB=[[0,-2],[2,0],[-2,0],[0,2],[0,-4],[3,-2],[-3,-2],[4,0],[-4,0]];
      for(const m of M){const Km=Math.ceil(m.zmax/SK)+1,X0=Math.max(0,m.b[0]-4),X1=Math.min(W,m.b[2]+Km+2),Y0=Math.max(16,m.b[1]-4),Y1=Math.min(H,m.b[3]+Math.ceil(Km*.45)+2);
        for(let y=Y0;y<Y1;y++)for(let x=X0;x<X1;x++){const p=y*W+x;if(MR[p]||DN[p])continue;DN[p]=1;const o=p*4;
          if(x<m.b[2]+4&&y<m.b[3]+4){let near=0;for(const [a,c] of NB){const u=x+a,v=y+c;if(u>=0&&v>=0&&u<W&&v<H&&MR[v*W+u]){near=Math.abs(a)+Math.abs(c);break}}
            if(near){const h=PX.hash(x,y,seed+84);mix(o,LO,near<=2?.22:.1);if(h<.16)put(o,RC[h<.05?1:h<.11?2:3]);else if(h<.22&&near>2)put(o,RC[4]);else if(SNW&&h>.6)put(o,SNW[1]);else if(h>.8&&!desert)mix(o,GT[1],.5)}}
          if(shadowed(x&~1,y&~1,0,2,m.b[0],m.b[1]))mix(o,LO,.42)}}
      // (3) the rock, front to back a column at a time
      const SN=SNW||null,MS=P.rock.m?P.rock.m.map(hx):null,lich=hx('#b4b48c');
      for(let x=rx0;x<rx1;x++){let hz=1e9,prev=false;
        for(let y=CY1[x]-1;y>=CY0[x];y--){const p=y*W+x,id=MR[p];if(!id){prev=false;continue}if(!prev)hz=Math.min(hz,y+1);prev=true;
          const z=ZR[p],sy=Math.round(y-z);if(sy>=hz)continue;const m=M[id-1];
          const gx=((x<W-1?ZR[p+1]:0)-(x?ZR[p-1]:0))/2,gy=((y<H-1?ZR[p+W]:0)-(y?ZR[p-W]:0))/2,nl=Math.hypot(gx,gy,1),nz=1/nl,lam=(-gx*LX-gy*LY+LZ)/nl/LN_;
          const v0=.5+.45*lam-(shadowed(x,y,z)?.22:0);
          for(let r=Math.max(0,sy);r<hz&&r<H;r++){const q=r*W+x,o=q*4,hg=y-r;
            let v=v0-.16*Math.max(0,1-hg/10)+(NT(x,r)-.5)*.1+(PX.hash(x,r,seed+85)-.5)*.07;
            let k=v>.82?0:v>.66?1:v>.48?2:v>.32?3:4;if(nz<.5&&PX.hash(x,(r+(x&3))>>2,seed+86)<.07)k=Math.min(4,k+1);if(RB&&nz>.8)k=Math.max(1,k);
            put(o,RC[k]);
            if(RB){if(nz<.8||r>sy){const u=(hg+NT(x,7)*4)/3.5,bd=Math.floor(u)&3;if(bd===1)mix(o,RB[0],.32);else if(bd===3)mix(o,RB[1],.3);if(u%1<.29&&nz<.6)mix(o,RB[2],.4)}else if(PX.hash(x,r,seed+88)<.06)mix(o,RB[2],.3)}
            else if(SN){if(nz>.5&&hg>m.zmax*.46+(NT(x,r)-.5)*10||nz>.82&&hg>8)put(o,SN[v>.66?0:v>.42?1:2])}
            else if(MS){if(nz>.55&&NT(x+70,y)>.5||hg<3&&PX.hash(x,r,seed+87)<.35)put(o,MS[k<2?0:k<4?1:2])}
            else{if(nz>.72&&hg<m.zmax*.6&&NT(x+40,y)>.6)put(o,GT[k<2?0:k<4?1:2]);else if(PX.hash(x,r,seed+87)<.005)put(o,lich)}
            F[q]=3;RS[q]=id;GY[q]=y}
          hz=sy}}
      // (4) the outline: round its silhouette, and along a crest over the rock behind it (the ground behind a step of 6+ px)
      const OUT=lerp(RC[4],[12,14,22],.35),CR=RC[4],s=(u,v)=>u<0||v<0||u>=W||v>=H?0:RS[v*W+u];
      for(let x=rx0;x<rx1;x++)for(let y=Math.max(0,CY0[x]-Math.ceil(zm)-1);y<CY1[x];y++){const q=y*W+x,id=RS[q];if(!id)continue;
        if(s(x,y-1)!==id||s(x-1,y)!==id||s(x+1,y)!==id||s(x,y+1)!==id)put(q*4,OUT);
        else if(GY[q+W]-GY[q]>5)put(q*4,CR)}
      cv.under=UND;return RS}
    // (3) colour, pixel by pixel
    each((x,y,i)=>{const o=i*4,t=T[i];
      if(hasW){const w=WV[i];if(w){water(o,x,y,i,w);return}const dl=DL[i]/3;if(dl<=3.2&&bank(o,x,y,dl))return;
        if(oasis){const q=(12-dl)/12+(NP(x,y)-.5)*.5;if(q>.3)mix(o,GR[q>.6?1:0],q>.55?.7:.4)}else if(dl<8)mix(o,LO,(8-dl)*.025)}// (the desert's green fringe; elsewhere the ground cools toward the water)
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
      if(WL){if(t){let d1=0,st=0;for(let d=1;d<=2*FHS+2;d++){const u=Tat(x,y+d);if(u<t){d1=d;st=t-u;break}}if(wlTop(o,x,y,i,t,d1,st))return}wlLow(o,x,y,t);return}
      if(t){let d1=0,st=0;for(let d=1;d<=2*FH+2;d++){const u=Tat(x,y+d);if(u<t){d1=d;st=t-u;break}}
        const fh=FH*st;
        if(d1&&d1<=fh){F[i]=1;const f=(fh-d1)/(fh-1),band=(d1+((x>>3)&1)+(PX.hash(x>>2,y+d1,seed+11)>.8?1:0))%3===0;let k=f<.22?0:f<.5?1:f<.8?2:3;if(band&&k<3)k++;
          put(o,FC[k]);const p=PX.hash(x,y,seed+12);if(p>.95)put(o,FC[Math.max(0,k-1)]);else if(p<.03)put(o,FC[3]);
          if(d1===fh){put(o,FC[0]);mix(o,HI,.3)}else if(d1===fh-1&&p>.5)put(o,FC[0]);return}
        if(d1&&d1<=fh+2){mix(o,HI,d1===fh+1?.55:.25);return}// (the rim catches the light)
        // the side walls: the east one in shade (3 px a level), the west one lit (1 px a level)
        for(let d=1;d<=6;d++){const u=Tat(x+d,y);if(u<t){if(d<=3*(t-u)){F[i]=2;put(o,FC[d===1?3:2]);if(PX.hash(x,y,seed+13)>.9)put(o,FC[1]);return}break}}
        for(let d=1;d<=2;d++){const u=Tat(x-d,y);if(u<t){if(d<=t-u){F[i]=2;put(o,FC[1]);return}break}}
        if(Tat(x,y-1)<t){mix(o,HI,.45);return}if(Tat(x-1,y)<t){mix(o,HI,.25);return}}
      for(let d=1;d<=6;d++)if(Tat(x,y-d)>t){mix(o,LO,FOOT[d-1]);return}// (the shadow at the cliff's foot)
      for(let d=1;d<=2;d++)if(Tat(x-d,y)>t){mix(o,LO,.35);return}// (and east of its shaded wall)
      if(Tat(x,y+1)>t){put(o,LN);return}if(Tat(x,y+2)>t)mix(o,LN,.55)});// (the north edge, outlined)
    if(WL)paintRamps();
    // (3c) mountains and spires (kind 6): see rockMasses
    const RS=kind.includes(6)?rockMasses():null;
    g.putImageData(img,0,0);
    // (4) what stands on the ground. A tree's crown never hides a cliff (its foot, middle and crown kept off the faces)
    const R2=PX.dice(PX.rng(seed*31+7)),Pg=PX.paint(g),things=[],edgeCell=(i,j)=>{for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(cell(kind,i+a,j+b)!==1)return true;return false};
    // a river's bridges: their decks' boxes first (nothing else stands on them or by their ends: KO). A deck spans its cells across
    // the flow and reaches 4 px onto each bank; stone in the frost and the hills (or by a terrace), else its climate's make
    const R3=PX.dice(PX.rng(seed*53+11)),KO=[],keep=(x,y)=>KO.some(b=>x>=b[0]&&x<b[2]&&y>=b[1]&&y<b[3]);
    const comps=k=>{const seen=new Uint8Array(C*R),out=[];for(let q0=0;q0<C*R;q0++){if(kind[q0]!==k||seen[q0])continue;const st=[q0],b={c0:C,c1:-1,r0:R,r1:-1};seen[q0]=1;
      while(st.length){const q=st.pop(),i=q%C,j=(q-i)/C;if(i<b.c0)b.c0=i;if(i>b.c1)b.c1=i;if(j<b.r0)b.r0=j;if(j>b.r1)b.r1=j;
        for(const [a,c] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+c,n=y*C+x;if(x>=0&&y>=0&&x<C&&y<R&&!seen[n]&&kind[n]===k){seen[n]=1;st.push(n)}}}out.push(b)}return out};
    const BR=hasW?comps(5).map(b=>{let lo=1e9,hi=-1;const A0=(flowV?b.r0:b.c0)*cs,A1=((flowV?b.r1:b.c1)+1)*cs,s0=Math.max(0,(flowV?b.c0:b.r0)*cs-32),s1=Math.min(flowV?W:H,((flowV?b.c1:b.r1)+1)*cs+32);
      for(let a=A0;a<A1;a++)for(let q=s0;q<s1;q++){const v=flowV?Wv(q,a):Wv(a,q);if(v&&v!==255){if(q<lo)lo=q;if(q>hi)hi=q}}
      const t0=Math.min((flowV?b.c0:b.r0)*cs,lo)-4,t1=Math.max(((flowV?b.c1:b.r1)+1)*cs,hi+1)+4,box=flowV?[t0,A0,t1,A1]:[A0,t0,A1,t1];
      let stone=RP.bridge==='stone'||/hill/.test(rk);for(let j=b.r0-2;j<=b.r1+2&&!stone;j++)for(let i=b.c0-2;i<=b.c1+2;i++)if(cell(lvl,i,j)){stone=true;break}
      KO.push([box[0]-8,box[1]-10,box[2]+8,box[3]+12]);return{box,stone}}):[];
    const clear=(x,y)=>!Fat(x,y)&&!Fat(x,y-6)&&!Fat(x,y-12)&&!Fat(x-5,y-7)&&!Fat(x+5,y-7)&&!Wat(x,y)&&(!hasW||Dl(x,y)>9&&!keep(x,y)),SPN=noise(W,H,56,seed+20),DN=noise(W,H,40,seed+21);
    // (a standing tree, 32 px: its foot and crown kept off the cliffs (a crown never hides one), the pools and the river's banks)
    const clearT=(x,y)=>clear(x,y)&&!Fat(x-4,y)&&!Fat(x+4,y)&&!Fat(x,y-18)&&!Fat(x,y-26)&&!Fat(x-11,y-12)&&!Fat(x+11,y-12)&&!Fat(x-8,y-22)&&!Fat(x+8,y-22)&&!Fat(x-12,y-4)&&!Fat(x+12,y-4)&&(!hasW||Dl(x,y)>14&&!keep(x,y-12));
    const species=(x,y)=>{let r=SPN(x,y)*.7+PX.hash(x,y,seed+22)*.3,a=0;for(const [n,s] of P.species){a+=s;if(r<a)return n}return P.species[P.species.length-1][0]};
    // woods: thick on their edges (the patch reads), clearings and thickets inside, bushes in the gaps. The trees stand (TREES: the
    // game draws them sorted with the soldiers); their shadows, roots and the bushes are painted
    const TREES=[];
    if(!bare)for(let y=6,row=0;y<H+8;y+=12,row++)for(let x=(row&1)*7;x<W;x+=14){const tx=x+R2.int(-3,3),ty=y+R2.int(-3,3);
      if(Kat(tx,ty)!==1||Kat(tx-6,ty)!==1||Kat(tx+6,ty)!==1||Kat(tx,ty-10)!==1)continue;
      if(!clearT(tx,ty)){if(clear(tx,ty)&&R2.chance(.4))things.push({y:ty,k:'bush',x:tx,v:R2.int(0,2)});continue}const e=edgeCell(Math.floor(tx/cs),Math.floor(ty/cs));
      if(R2.chance(e?.85:.15+.5*DN(tx,ty)))TREES.push({y:ty,x:tx,sp:species(tx,ty),v:R2.int(0,2)});else if(R2.chance(.5))things.push({y:ty,k:'bush',x:tx,v:R2.int(0,2)})}
    // lone trees and copses in the open (nothing collides)
    if(!bare){const spot=()=>{for(let k=0;k<30;k++){const x=R2.int(40,W-40),y=R2.int(56,H-30);if(!Kat(x,y)&&!Kat(x,y-14)&&clearT(x,y))return[x,y]}return null};
      for(let n=R2.int(3,6);n>0;n--){const s=spot();if(s)TREES.push({y:s[1],x:s[0],sp:species(s[0],s[1]),v:R2.int(0,2)})}
      for(let n=R2.int(1,2);n>0;n--){const s=spot();if(!s)continue;const sp=species(s[0],s[1]);for(let m=R2.int(3,5);m>0;m--){const x=s[0]+R2.int(-20,20),y=s[1]+R2.int(-10,10);if(!Kat(x,y)&&clearT(x,y))TREES.push({y,x,sp,v:R2.int(0,2)})}}}
    // an oasis: palms round the pool, reeds at its edge
    if(oasis)for(let y=8,row=0;y<H;y+=11,row++)for(let x=(row&1)*8;x<W;x+=16){const tx=x+R2.int(-2,2),ty=y+R2.int(-2,2);if(tx<0||ty<0||tx>=W||ty>=H)continue;const q=Q[ty*W+tx];
      if(q>.4&&q<.8&&!Wat(tx,ty)&&clearT(tx,ty)&&R2.chance(.6))TREES.push({y:ty,x:tx,sp:'palm',v:R2.int(0,2)});else if(q>.8&&q<.88&&R2.chance(.5))things.push({y:ty,k:'reed',x:tx,v:R2.int(0,99)})}
    if(!oasis)for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(kind[j*C+i]!==2)continue;for(let n=0;n<3;n++){const tx=i*cs+R2.int(1,14),ty=j*cs+R2.int(2,15);
      if(Kat(tx,ty)!==2||Wat(tx,ty)||Wat(tx,ty+1)||Fat(tx,ty))continue;const shore=Wat(tx,ty+2)||Wat(tx+3,ty)||Wat(tx-3,ty)||Wat(tx,ty-3);if(shore||R2.chance(.5))things.push({y:ty,k:'reed',x:tx,v:R2.int(0,99)})}}
    // the small details, first (flat on the ground): by climate, in the open and in woods; never on a cliff, a pool or an oasis
    for(let j=1;j<R;j++)for(let i=0;i<C;i++){const k=kind[j*C+i];if(k===2)continue;for(const [d,ch] of P.detail[k===1?1:0]){if(!R2.chance(ch))continue;const x=i*cs+R2.int(2,13),y=j*cs+R2.int(3,15);
      if(y<16||Fat(x,y)||Fat(x+3,y)||Fat(x-3,y)||Kat(x,y)!==k||oasis&&Q[y*W+x]>.25||hasW&&(Dl(x,y)<15||Dl(x-4,y)<15||Dl(x+4,y)<15||keep(x,y)))continue;DETAIL[d](Pg,x,y,R2.int(0,999),P,g,clim)}}
    // the river's flat details: current lines and glints on the deep (floes on a cold one, weed on a swamp's), stepping stones across
    // a ford (cracks in a frozen one), stones at the water's edge, reeds on its banks (palms by a desert's); then its bridges
    if(hasW){const S=RP.stone,WD=RP.wood,sl=k=>SLP[Math.max(0,Math.min((flowV?R:C)-1,Math.floor(k/cs)))],okDeep=(x,y,m)=>Wv(x,y)===2&&DW[y*W+x]>=m*3&&!keep(x,y);
      const stone=(x,y,v)=>{const w=5+(v&1);Pg.rect('rgba(10,18,34,.4)',x+1,y+4,w-1,1);Pg.rect(S[3],x+1,y+3,w-2,1);Pg.px(S[3],x+w-1,y+2);Pg.rect(S[0],x+1,y,w-2,1);Pg.rect(S[1],x,y+1,w,2);Pg.px(S[0],x,y+1);Pg.px(S[0],x+1,y+1);Pg.px(S[2],x+w-1,y+1);Pg.rect(S[2],x+2,y+2,w-3,1);
        if(clim==='swamp'&&v%3===0)Pg.px('#6a7a3c',x+1,y);if(!ICE){Pg.px(RP.foam,x+(w>>1),y+4);if(v&2)Pg.px(RP.foam,x+w,y+3)}};
      const floe=(x,y,v)=>{const rx=2+v%3,ry=1+(v>>2)%2;for(let b=-ry-1;b<=ry+1;b++)for(let a=-rx-1;a<=rx+1;a++)if(!okDeep(x+a,y+b,2))return;
        for(let b=-ry;b<=ry;b++)for(let a=-rx;a<=rx;a++){const e=(a/(rx+.5))**2+(b/(ry+.5))**2;if(e>1)continue;Pg.px(b===ry||b===ry-1&&e>.55?RP.ice[3]:b<0||a<0?RP.ice[0]:RP.ice[1],x+a,y+b)}
        Pg.rect(RP.w[3],x-rx+1,y+ry+1,2*rx,1)};
      for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(kind[j*C+i]!==4)continue;
        for(let n=0;n<2;n++){const x=i*cs+R3.int(0,15),y=j*cs+R3.int(0,15);if(!okDeep(x,y,ICE?6:4))continue;
          if(ICE){if(R3.chance(.4))floe(x,y,R3.int(0,99));continue}
          if(R3.chance(.6)){const L=R3.int(3,7),k0=sl(flowV?y:x),pts=[];for(let k=0;k<L;k++){const px=flowV?Math.round(x+k0*k):x+k,py=flowV?y+k:Math.round(y+k0*k);if(!okDeep(px,py,3))break;pts.push([px,py])}
            pts.forEach(([px,py],k)=>Pg.px(k===pts.length-1&&R3.chance(.35)?P.glint:clim==='swamp'?PX.mix(RP.w[1],RP.w[2],.4):RP.w[1],px,py))}
          else if(R3.chance(.5)){if(clim==='swamp'&&R3.chance(.5)){Pg.rect('#5e7a3e',x,y,2,1);Pg.px('#7a9650',x,y)}else Pg.rect(P.glint,x,y,2,1)}}}
      if(ICE)for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(kind[j*C+i]!==3||!R3.chance(.5))continue;let x=i*cs+R3.int(2,13),y=j*cs+R3.int(2,13);const sx=R3.chance(.5)?1:-1;
        for(let k=R3.int(5,10);k>0;k--){if(Wv(x,y)!==1||DW[y*W+x]<6||keep(x,y))break;Pg.px('#ffffff',x-1,y-1);Pg.px(RP.ice[3],x,y);if(R3.chance(.6))x+=sx;else y+=R3.chance(.5)?1:-1}}
      else for(const f of comps(3)){const lo=(flowV?f.r0:f.c0)*cs,hi=((flowV?f.r1:f.c1)+1)*cs,s0=(flowV?f.c0:f.r0)*cs-6,s1=((flowV?f.c1:f.r1)+1)*cs+6,n=Math.max(1,Math.round((hi-lo)/160));
        for(let r=0;r<n;r++){const a=lo+Math.round((r+.5)*(hi-lo)/n);for(let q=s0+R3.int(1,3);q<s1;q+=R3.int(6,8)){const x=flowV?q:a+R3.int(-1,1),y=flowV?a+R3.int(-1,1):q;
          if(Wv(x,y)===1&&Wv(x+5,y)===1&&Wv(x,y+4)===1&&Wv(x+5,y+4)===1&&!keep(x,y))stone(x,y,R3.int(0,99))}}}
      for(let y=by0+R3.int(0,2);y<by1;y+=3)for(let x=bx0;x<bx1;x++){const dl=Dl(x,y);if(y<16||keep(x,y))continue;
        if(dl>=3&&dl<=5){if(R3.chance(RP.reeds))things.push({y,k:'reed',x,v:R3.int(0,99)});continue}if(PX.hash(x,y,seed+64)>.34)continue;const tx=x,ty=y;
        if(!dl){if(DW[ty*W+tx]<=4&&R3.chance(.03))stone(tx-2,ty-1,R3.int(0,99))}
        else if(oasis&&dl>=15&&dl<=36&&R3.chance(.012)&&clearT(tx,ty))TREES.push({y:ty,x:tx,sp:'palm',v:R3.int(0,2)});
        else if(ICE&&dl>=12&&dl<=27&&R3.chance(.012))DETAIL.icerock(Pg,tx,ty,0,P)}
      // a bridge across the flow (X0-X1 its length, Y0-Y1 its 32 px): its shadow on the water to the lower right, earth ramps onto
      // the banks; wood: piles foaming in the water, a side beam, planks across the way (each its own tone, ragged, worn), railings
      // on posts every 8 px; stone: arches over the water between foaming piers, a roadway of setts, parapets capped (snow in the
      // frost), pillars at its ends
      const shadeOn=(x,y,a)=>{const v=Wv(x,y);if(v&&v!==255)Pg.px('rgba(10,18,34,'+a.toFixed(2)+')',x,y)};
      const deckH=(X0,X1,Y0,Y1,stone)=>{for(let y=Y1;y<Y1+(stone?10:8);y++)for(let x=X0+2;x<X1+3;x++)shadeOn(x,y,.46-(y-Y1)*.04);
        for(const x of [X0-4,X1]){Pg.rect(RP.earth[1],x,Y0,4,Y1-Y0);Pg.rect(RP.earth[0],x,Y0,4,1);Pg.rect(RP.earth[2],x,Y1-1,4,1)}
        if(!stone){for(let x=X0+6;x<X1-6;x+=11){const v=Wv(x,Y1+4);if(!v||v===255)continue;Pg.rect(WD[2],x,Y1+2,2,4);Pg.px(WD[3],x+1,Y1+2);Pg.px(RP.foam,x-1,Y1+5);Pg.px(RP.foam,x+2,Y1+5);Pg.px(RP.w[0],x,Y1+7);Pg.px(RP.w[0],x+1,Y1+8)}
          Pg.rect(WD[2],X0,Y1,X1-X0,1);Pg.rect(WD[3],X0,Y1+1,X1-X0,1);
          for(let x=X0;x<X1;x++){const k=Math.floor((x-X0)/4),c=(x-X0)%4;if(c===3){Pg.rect(WD[2],x,Y0,1,Y1-Y0);continue}
            const tone=PX.hash(k,0,seed+70)<.5?WD[0]:WD[1],t0=Y0+(PX.hash(k,1,seed+70)<.3?1:0),t1=Y1-(PX.hash(k,2,seed+70)<.3?1:0);Pg.rect(c?tone:PX.mix(tone,P.hi,.2),x,t0,1,t1-t0);
            for(let y=t0;y<t1;y++){const q=PX.hash(x,y,seed+71);if(q<.012)Pg.px(WD[2],x,y);else if(q>.995)Pg.px(WD[3],x,y)}}
          Pg.rect('rgba(20,14,10,.3)',X0+1,Y0+1,X1-X0,1);
          for(const ry of [Y0-3,Y1-5]){Pg.rect(WD[0],X0,ry,X1-X0,1);Pg.rect(WD[2],X0,ry+1,X1-X0,1);for(let x=X0+1;x<X1-1;x+=8){Pg.rect(WD[1],x,ry,2,4);Pg.px(WD[0],x,ry);Pg.px(WD[2],x+1,ry+3)}}
          for(const x of [X0-1,X1-2])for(const y of [Y0-5,Y1-7]){Pg.rect(WD[2],x,y,3,6);Pg.rect(WD[1],x,y,2,5);Pg.px(WD[0],x,y)}return}
        const n=Math.max(1,Math.round((X1-X0)/18)),sw=(X1-X0)/n,FH2=6;
        for(let x=X0;x<X1;x++){const u=((x-X0)%sw)/sw,v=Wv(x,Y1+FH2),wet=v&&v!==255,a=(u-.5)/.34,top=Math.abs(a)<1?(FH2-1)-(FH2-2)*Math.sqrt(1-a*a):99;
          for(let r=0;r<FH2;r++){let c;if(wet&&r>=top)c=r>=top+1?'#141c26':S[3];else{c=r===FH2-1?S[3]:r%2===1||(x+(r>>1)*2)%5===0?S[2]:S[1];if(wet&&r>=top-1)c=S[0]}Pg.px(c,x,Y1+r)}}
        for(let k=0;k<=n;k++){const x=Math.round(X0+k*sw),v=Wv(x,Y1+FH2);if(!v||v===255)continue;Pg.px(RP.foam,x-1,Y1+FH2);Pg.px(RP.foam,x+1,Y1+FH2);Pg.px(RP.foam,x,Y1+FH2+1);Pg.px(RP.w[0],x,Y1+FH2+3)}
        for(let y=Y0;y<Y1;y++)for(let x=X0;x<X1;x++){const r=y-Y0,row=Math.floor(r/3),cx=x-X0+(row&1)*2,q=PX.hash(Math.floor(cx/5),row,seed+72);let c=r%3===2||cx%5===4?PX.mix(S[1],S[2],.65):q<.4?S[0]:S[1];if(r%3===0&&cx%5===0&&c!==S[2])c=PX.mix(S[0],P.hi,.3);Pg.px(c,x,y)}
        for(const py of [Y0-3,Y1-4]){for(let x=X0;x<X1;x++){Pg.px(ICE&&PX.hash(x,py,seed+73)>.25?'#f4f8fc':S[0],x,py);for(let r=1;r<3;r++)Pg.px((x-X0+r*2)%6===0?S[3]:S[1],x,py+r);Pg.px(S[3],x,py+3)}}
        for(const x of [X0-2,X1-2])for(const y of [Y0-5,Y1-6]){Pg.rect(S[2],x,y,4,6);Pg.rect(S[1],x,y+1,3,4);Pg.rect(ICE?'#f4f8fc':S[0],x,y,4,1)}};
      // (a river across the field: a plain deck down it, rails on its sides)
      const deckV=(X0,X1,Y0,Y1,stone)=>{const M=stone?S:WD;for(let y=Y1;y<Y1+5;y++)for(let x=X0+2;x<X1+3;x++)shadeOn(x,y,.4-(y-Y1)*.07);
        for(let y=Y0;y<Y1;y++){const k=Math.floor((y-Y0)/4);Pg.rect((y-Y0)%4===3?M[2]:PX.hash(k,3,seed+70)<.5?M[0]:M[1],X0,y,X1-X0,1)}
        for(const x of [X0,X1-2]){Pg.rect(M[2],x,Y0,2,Y1-Y0);Pg.rect(M[0],x,Y0,1,Y1-Y0)}};
      for(const b of BR)(flowV?deckH:deckV)(b.box[0],b.box[2],b.box[1],b.box[3],b.stone);
      // the water's motion, drawn each frame over the ground (PX.battleWater): glints (0) and current lines (1) drifting down the deep,
      // riffles (2) on a ford, sparkles (3) on ice, bits of ice (4) on a cold river. Each: a seeded start, a path down the flow checked
      // clear of banks, shelves and bridges, its length, speed (px/s; a sparkle: twinkles a second) and phase. Its own stream (R4):
      // the still picture is untouched
      const R4=PX.dice(PX.rng(seed*71+5)),AN=[[],[],[],[],[]],path=(x,y,L,ok)=>{const s=sl(flowV?y:x);for(let k=0;k<=L+2;k++){const px=Math.round(flowV?x+s*k:x+k),py=Math.round(flowV?y+k:y+s*k);if(!ok(px,py)||keep(px,py))return null}return flowV?[s,1]:[1,s]};
      const inDeep=(a,b)=>Wv(a,b)===2&&DW[b*W+a]>=(ICE?18:9),inFord=(a,b)=>Wv(a,b)===1&&DW[b*W+a]>=6;
      for(let j=0;j<R;j++)for(let i=0;i<C;i++){const k=kind[j*C+i];if(k!==3&&k!==4)continue;
        for(let n=0;n<(k===3?2:3);n++){const x=i*cs+R4.int(0,15),y=j*cs+R4.int(0,15),ty=k===3?(ICE?3:2):ICE?(n?4:0):(n===0?1:0),L=ty===3?0:ty===2?R4.int(5,9):ty===4?R4.int(8,14):R4.int(10,22);
          const u=path(x,y,L,k===3?inFord:inDeep);if(!u)continue;const v=ty===0?R4.int(60,100)/10:ty===1?R4.int(40,70)/10:ty===2?R4.int(30,50)/10:ty===4?R4.int(15,30)/10:R4.int(25,45)/100;
          AN[ty].push(x,y,u[0],u[1],L,v,ty===3?R4.R():R4.R()*L)}}
      cv.water={a:Float32Array.from(AN.flat()),n:AN.map(l=>l.length/7),flowV,col:[P.glint,RP.w[0],RP.foam,'#ffffff',RP.ice?RP.ice[0]:P.glint]}}
    // a standing tree's ground: its shadow to the lower right and its roots (none under snow nor sand); the tree itself is a sprite
    for(const t of TREES){g.drawImage(shadowSprite(t.sp==='palm'||t.sp==='dead'||t.sp==='bbirch'?14:22),t.x-5,t.y-5);
      if(clim==='frost'||t.sp==='palm')continue;const h=PX.hash(t.x,t.y,seed+23);Pg.px(P.trunk[1],t.x-3,t.y);Pg.px(P.trunk[1],t.x+3,t.y);if(h>.4){Pg.px(P.trunk[1],t.x-4,t.y+1);Pg.px(P.trunk[0],t.x-3,t.y-1)}if(h<.7)Pg.px(P.trunk[1],t.x+4,t.y+1)}
    things.sort((a,b)=>a.y-b.y||a.x-b.x);
    for(const t of things){
      if(t.k==='bush'){g.drawImage(shadowSprite(8),t.x-2,t.y-2);g.drawImage(treeSprite(clim,'oak',t.v,true),t.x-4,t.y-7)}
      else reeds(Pg,t.x,t.y,t.v,P)}
    // glints on the open pools (still: the ground is painted once); lily pads on warm water
    for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(kind[j*C+i]!==2)continue;for(let n=0;n<2;n++){const tx=i*cs+R2.int(0,13),ty=j*cs+R2.int(0,15);
      if(Wat(tx,ty)!==2||Wat(tx+2,ty)!==2||Wat(tx,ty-1)!==2)continue;if(!P.ice&&R2.chance(.35)){Pg.rect('#5e7a3e',tx,ty,2,1);Pg.px('#7a9650',tx,ty)}else Pg.rect(P.glint,tx,ty,P.ice?3:2,1)}}
    /* (5) what stands up out of the ground, for the game to draw sorted by depth with the soldiers (cv.props, sorted by y):
       trees {dk:1, x, y (the trunk's foot), s (its sprite), dx, dy (where s is drawn), box (its drawn pixels, field px)}, and the
       plateaus' south cliff faces {dk:2, x, y (its foot: the face's lowest row), s, dx, dy, box (as a tree's), sx, sy, w, h}: the
       faces' pixels cut into sections a column run each, up to 16 px wide, whose columns' foot rows lie within 2 px (its foot: the highest of them), each its own small
       picture (one big shared one is slow to draw from among many others); a soldier whose feet are higher on the screen than a
       section's foot is behind it (on the rim above the climb) */
    const props=[];for(const t of TREES){const s=treeSprite32(clim,t.sp,t.v),b=s.box;props.push({dk:1,x:t.x,y:t.y,s,dx:t.x-16,dy:t.y-31,box:[t.x-16+b[0],t.y-31+b[1],t.x-16+b[2],t.y-31+b[3]]})}
    // (the mountains' too {dk:3, ...as a face's}: their pixels' column runs, each run one mass's, cut the same way)
    const cutF=F.includes(1);
    if(cutF||RS){const src=g.getImageData(0,0,W,H).data,fc=PX.canvas(W,H),fg=fc.getContext('2d'),fi=fg.createImageData(W,H),fd=fi.data;
      const cut=(v,dk,ID)=>{let open=[];for(let x=0;x<W;x++){const runs=[];for(let y=0;y<H;y++){if(F[y*W+x]!==v)continue;const id=ID?ID[y*W+x]:0;let y1=y;while(y1+1<H&&F[(y1+1)*W+x]===v&&(!ID||ID[(y1+1)*W+x]===id))y1++;runs.push([y,y1,id]);
          for(let k=y;k<=y1;k++){const o=(k*W+x)*4;fd[o]=src[o];fd[o+1]=src[o+1];fd[o+2]=src[o+2];fd[o+3]=255}y=y1}
        const next=[];for(const [y0,y1,id] of runs){let s=open.find(q=>q.id===id&&Math.max(q.yb,y1)-Math.min(q.y,y1)<=2&&q.lt<=y1+1&&y0<=q.lb+1&&x-q.sx<16);
          if(s){open.splice(open.indexOf(s),1);s.w++;if(y0<s.sy){s.h+=s.sy-y0;s.sy=y0}if(y1>s.yb){s.h+=y1-s.yb;s.yb=y1}if(y1<s.y)s.y=y1}else{s={dk,x,y:y1,yb:y1,sx:x,sy:y0,w:1,h:y1-y0+1,id};props.push(s)}s.lt=y0;s.lb=y1;next.push(s)}
        open=next}};
      if(cutF)cut(1,2);if(RS)cut(3,3,RS);
      fg.putImageData(fi,0,0);for(const p of props)if(p.dk>=2){p.x=p.sx+(p.w>>1);p.box=[p.sx,p.sy,p.sx+p.w-1,p.sy+p.h-1];p.dx=p.sx;p.dy=p.sy;p.s=PX.canvas(p.w,p.h,q=>q.drawImage(fc,p.sx,p.sy,p.w,p.h,0,0,p.w,p.h));delete p.lt;delete p.lb;delete p.yb;delete p.id}}
    props.sort((a,b)=>a.y-b.y||a.x-b.x);cv.props=props;
    return cv};
  // the standing props of a ground (trees and cliff faces, PX.battleGround's cv.props) drawn in their order over it: the gallery's
  // preview (the game sorts them in with its soldiers: render.js). view: [x0,y0,x1,y1] field px, or all
  PX.battleProps=(g,ground,view)=>{const L=ground&&ground.props;if(!L)return;for(const p of L){const b=p.box;if(view&&(b[2]<view[0]||b[0]>view[2]||b[3]<view[1]||b[1]>view[3]))continue;
    g.drawImage(p.s,p.dx,p.dy)}};

  /* a river's motion, drawn each frame over its ground (render.js, after the ground, before the men): ground.water from battleGround
     (none: nothing). t: seconds (the caller's clock: still when the battle is paused); view: [x0,y0,x1,y1] in field px, the rest
     skipped. Each item fades in and out over its run down the flow (a sine), its alpha in steps of .1; a sparkle shows a fifth of its
     beat. Whole pixels, a few hundred fillRects at most */
  const WA_MAX=[.9,.55,.75,1,.9];
  PX.battleWater=(g,ground,t,view)=>{const A=ground&&ground.water;if(!A)return;const a=A.a,fv=A.flowV,x0=view[0]-24,y0=view[1]-24,x1=view[2]+8,y1=view[3]+8;let o=0;const ga=g.globalAlpha;
    for(let ty=0;ty<5;ty++){g.fillStyle=A.col[ty];const am=WA_MAX[ty];
      for(let m=0;m<A.n[ty];m++,o+=7){const x=a[o],y=a[o+1];if(x<x0||y<y0||x>x1||y>y1)continue;
        if(ty===3){const ph=(t*a[o+5]+a[o+6])%1;if(ph>.2)continue;const al=Math.round(Math.sin(ph*5*Math.PI)*10)/10;if(al<=0)continue;g.globalAlpha=al;g.fillRect(x,y,1,1);if(al>.6){g.globalAlpha=al*.5;g.fillRect(x-1,y,3,1);g.fillRect(x,y-1,1,3)}continue}
        const L=a[o+4],s=(t*a[o+5]+a[o+6])%L,k=Math.floor(s),al=Math.round(Math.sin(Math.PI*s/L)*am*10)/10;if(al<=0)continue;g.globalAlpha=al;
        const px=Math.round(x+a[o+2]*k),py=Math.round(y+a[o+3]*k);
        if(ty===1){for(let q=0;q<3;q++)g.fillRect(Math.round(x+a[o+2]*(k+q)),Math.round(y+a[o+3]*(k+q)),1,1)}
        else if(ty===2)g.fillRect(fv?px-1:px,fv?py:py-1,fv?3:1,fv?1:3);
        else g.fillRect(px,py,fv?2:1,fv?1:2)}}
    g.globalAlpha=ga};

  // the small map: a pixel a cell, the painted ground's average there, its terrace edges dark (a contour a cell wide); a mountain's
  // cells its rock (lighter as it rises; snow on a cold one), the cells its peaks stand over their ground (ground.under); with walls a
  // cliff's contour darker, a slope's faint
  PX.battleGroundMini=(spec,ground)=>{const C=spec.C,R=spec.R,cs=spec.cs||16,P=PX.GROUND_PAL[spec.climate]||PX.GROUND_PAL.grass,lvl=spec.lvl||new Uint8Array(C*R),kind=spec.kind||new Uint8Array(C*R),U=ground&&ground.under,WL=spec.wall&&spec.wall.length===C*R?spec.wall:null,RP=(P.rock||PX.GROUND_PAL.grass.rock);
    return PX.canvas(C,R,g=>{const img=g.createImageData(C,R),M=img.data,G=ground?ground.getContext('2d').getImageData(0,0,ground.width,ground.height):null,B1=hx(P.base[1]),HI=hx(P.hi),LN=hx(P.line),LF=hx(P.leaf[3]),WA=hx(P.water[1]);
      for(let j=0;j<R;j++)for(let i=0;i<C;i++){const o=(j*C+i)*4,k=kind[j*C+i],l=lvl[j*C+i];let c=[0,0,0],n=0;
        if(G){for(let y=j*cs+1;y<Math.min(G.height,(j+1)*cs);y+=2)for(let x=i*cs+1;x<Math.min(G.width,(i+1)*cs);x+=2){const q=(y*G.width+x)*4;c[0]+=G.data[q];c[1]+=G.data[q+1];c[2]+=G.data[q+2];n++}}
        c=n?c.map(v=>v/n):B1.slice();const m=(d,t)=>{c=c.map((v,z)=>v+(d[z]-v)*t)};if(U&&k!==6&&U[(j*C+i)*3]>=0)c=[U[(j*C+i)*3],U[(j*C+i)*3+1],U[(j*C+i)*3+2]];
        // (a river: the deep darker, a ford lighter (ice in the frost), a bridge its make, so the crossings read)
        if(l)m(HI,.12*l);if(k===1&&P.species.length)m(LF,.4);else if(k===2)m(WA,.45);else if(k===4)m(hx(P.riv.w[3]),.5);else if(k===3)m(hx(P.riv.ice?P.riv.ice[0]:P.riv.bed),.45);
        else if(k===5)m(hx(P.riv.bridge==='stone'?P.riv.stone[0]:P.riv.wood[0]),.7);
        else if(k===6){const h=spec.rockH&&spec.rockH[j*C+i]||3;m(hx(RP.c[RP.s?3:2]),.9);if(h>=3)m(hx(RP.c[RP.s?2:1]),.45);if(RP.s&&h>=4)m(hx(RP.s[1]),.25)}
        if(WL){let e=0;for(const [a,b,bt,ob] of [[1,0,1,4],[-1,0,4,1],[0,1,2,8],[0,-1,8,2]]){const x=i+a,y=j+b;if(x<0||y<0||x>=C||y>=R||lvl[y*C+x]<=l)continue;e=Math.max(e,(WL[j*C+i]&bt)||(WL[y*C+x]&ob)?2:1)}if(e)m(LN,e===2?.9:.4)}
        else if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const x=i+a,y=j+b;return x>=0&&y>=0&&x<C&&y<R&&lvl[y*C+x]>l}))m(LN,.7);
        M[o]=c[0];M[o+1]=c[1];M[o+2]=c[2];M[o+3]=255}
      g.putImageData(img,0,0)})};
})(window.PX=window.PX||{});
