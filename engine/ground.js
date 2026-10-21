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
// PX.battleGroundSteps(spec): the same painting as a generator (R15): it yields how far through it is (0-1) between its stages
// (plain ground, height, pools, colour, ways and sand, mountains, what stands, the river's details and bridges, the desert's life,
// the props cut out) and every band of rows (PX.GROUND_BAND px) in the long ones. A yield only pauses it: the same pixels either
// way (tests/groundhash.js), so a battle's start paints its field in slices (loading.js runSteps; setup.js BattleSetup). It returns
// the field kept by tiles (R16: a PX.BattleGround, below); PX.battleGround paints the same at once as one canvas, and
// PX.battleGroundPaint(cv.plan, rect) any rect of it again, alone
// PX.battleWater(g,ground,t,view): a river's motion over its painted ground, each frame (glints, current, riffles, sparkles on ice).
// PX.battleGroundMini(spec,ground): the small map's picture, one pixel a cell (C×R), the painted ground averaged with its contours.
// Standing props (phase 3): the trees (32-px sprites, PX.battleTree) and the plateaus' south cliff faces are not left in the
// picture for good but handed back as cv.props, sorted by their feet, for the game to draw in the same depth order as its soldiers
// (and fade over its own); their shadows, roots, undergrowth and bushes stay painted. PX.battleProps(g,ground,view) draws them in
// order over the ground alone (the gallery). PX.battleCanopy(ground): every tree of them painted once into one layer (a big wood
// zoomed out: render.js LOD). Roads and paths (spec.ways, terrain.js): worn cart tracks and trodden trails painted into the ground
// (paintWays), fainter up a rise, no tree's crown over one (a gap in the canopy).
// The desert's life (4b): cacti, prickly pear, dead and dry shrubs, bones, small rocks, an oasis's grass and green shrubs, handed
// back as props too (dk 4, PX.desertSprite; cv.decor how many), over painted clay pans, pebbles, flecks and wind ripples.
// Phase 4: mountains and spires (kind 6) rise up the screen with real height, painted in the ground and handed back as props too
// (dk 3, cut as the faces are) so a soldier behind one is under it and yours make it fade; their shadows and scree stay painted.
// With walls a sheer cliff is grey rock, taller (12 px a level), cracked, a bright rim, a long shadow; a ramp (a slope of a ring with cliffs) purely natural: the cliff breaks and the hillside slopes down through the gap.
// Light from the upper left. A terrace is a raised plateau seen from the south, its top lighter and warmer; every edge with no
// cliff a smooth rise (slopePx: the ground's own cover shaded in soft steps down to its foot, inside the higher cells, so a soldier
// there is on the climb; grassy, earthy or stony by stretches; a soft shadow below), so a grey rock face means a cliff.
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
  // a smooth value noise in [0,1) over a W×H field: lattice step px, seed s (the lattice hashed once, then read). WR, a window
  // [x0,y0,x1,y1] (a tile's, R16): only the lattice over it (and NOISE_M px round) hashed ahead, any other point read as the
  // field's lattice would read it (its row-major wrap and its end included): the same values
  const NOISE_M=96;
  const noise=(W,H,step,s,WR)=>{const gw=Math.ceil(W/step)+2,gh=Math.ceil(H/step)+2;
    if(!WR){const A=new Float32Array(gw*gh);for(let j=0;j<gh;j++)for(let i=0;i<gw;i++)A[j*gw+i]=PX.hash(i,j,s);
      return(x,y)=>{const gx=x/step,gy=y/step,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),o=iy*gw+ix,a=A[o],b=A[o+1],c=A[o+gw],d=A[o+gw+1];
        return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy}}
    const i0=Math.max(0,Math.floor((WR[0]-NOISE_M)/step)),j0=Math.max(0,Math.floor((WR[1]-NOISE_M)/step)),i1=Math.min(gw-1,Math.ceil((WR[2]+NOISE_M)/step)),j1=Math.min(gh-1,Math.ceil((WR[3]+NOISE_M)/step)),cw=i1-i0+1,A=new Float32Array(cw*(j1-j0+1));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)A[(j-j0)*cw+i-i0]=PX.hash(i,j,s);
    const at=o=>{if(o<0||o>=gw*gh)return undefined;const j=Math.floor(o/gw),i=o-j*gw;return i>=i0&&i<=i1&&j>=j0&&j<=j1?A[(j-j0)*cw+i-i0]:Math.fround(PX.hash(i,j,s))};
    return(x,y)=>{const gx=x/step,gy=y/step,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);let a,b,c,d;
      if(ix>=i0&&ix<i1&&iy>=j0&&iy<j1){const q=(iy-j0)*cw+ix-i0;a=A[q];b=A[q+1];c=A[q+cw];d=A[q+cw+1]}else{const o=iy*gw+ix;a=at(o);b=at(o+1);c=at(o+gw);d=at(o+gw+1)}
      return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy}};

  /* roads and paths by climate (paintWays): c the track, light to deep (worn earth; packed snow in the frost, sand in the desert,
     mud in the swamp); rut a wheel rut; crown the strip between the ruts; wet what lies in a rut now and then (a puddle; ice in the
     frost; none in the desert); bank a verge's (snow piled up in the frost); stone the odd pebble */
  const WAYPAL={grass:{c:['#ac9066','#977b52','#7e6644'],rut:'#5e4a34',crown:'#86904e',wet:'#6c8a86',bank:null,stone:'#c4bca4'},
    frost:{c:['#d0d8e2','#bac4d2','#a4b0c2'],rut:'#8896ac',crown:'#e6ecf4',wet:'#f2f8fc',bank:'#f8fbfe',stone:'#8a7a68'},
    desert:{c:['#f2dfae','#e4c994','#d0b07c'],rut:'#b48e5c',crown:'#e8d2a0',wet:null,bank:null,stone:'#a8845a'},
    swamp:{c:['#80744e','#6c6142','#5a5036'],rut:'#3a3424',crown:'#5e6638',wet:'#4e6656',bank:null,stone:'#8a8a72'}};
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
  PX.smallTree=treeSprite;// (the 16-px trees: a town's streets, js/gfx/scenedraw.js)
  // a soft ground shadow (to the lower right: the light is upper left), half-transparent pixels on whole positions
  const SHADOW={};
  const shadowSprite=w=>SHADOW[w]||(SHADOW[w]=PX.canvas(w,Math.max(3,w>>1),g=>{const h=Math.max(3,w>>1);g.fillStyle='rgba(8,14,24,.3)';for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(((x+.5-w/2)/(w/2))**2+((y+.5-h/2)/(h/2))**2<=1)g.fillRect(x,y,1,1)}));
  PX.battleShadow=shadowSprite;
  /* a field's scattered obstacles where it has no terrain (the game's B.obs: a tree, a rock or a cactus, its radius r what blocks):
     PX.battleObstacle(kind,clim,v) â†’ {s, ax, ay, box, g, gx, gy}: s the standing sprite, drawn at (x-ax, y-ay) in the game's depth
     order with its soldiers (box: its drawn pixels in s); g what lies on the ground under it (its shadow to the lower right, the
     contact shade, roots or scree), drawn at (x-gx, y-gy) before them. v (0-5) the look: a tree is a PX.battleTree of the
     climate's (grass oak or birch, frost snowy pine, swamp willow or dead, desert palm), its trunk on the point; a rock a boulder in
     the climate's rock (GROUND_PAL rock: granite with tufts, snow-capped, banded sandstone, mossy), ~16 px across; a cactus a
     saguaro or a barrel cactus. Each footprint about what blocks (r 6, 7, 5). Kept, one a kind, climate and look; seeded */
  const OBST={},CACTUS=['#b4cc6c','#8ab452','#62903e','#43702f','#2b4c22'];
  // (the drawn pixels' box of a canvas)
  const boxOf=cv=>{const N=cv.width,H=cv.height,d=cv.getContext('2d').getImageData(0,0,N,H).data;let x0=N,y0=H,x1=-1,y1=-1;
    for(let y=0;y<H;y++)for(let x=0;x<N;x++)if(d[(y*N+x)*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}return[x0,y0,x1,y1]};
  // (a sprite from a tone map: 0 empty, else col[t]; the rim, every empty pixel beside one, in rim (none: no rim))
  const fromMap=(W,H,M,col,rim)=>PX.canvas(W,H,g=>{const Pg=PX.paint(g),at=(x,y)=>x>=0&&y>=0&&x<W&&y<H?M[y*W+x]:0;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=M[y*W+x];if(t)Pg.px(col[t],x,y);else if(rim&&(at(x+1,y)||at(x-1,y)||at(x,y+1)||at(x,y-1)))Pg.px(rim,x,y)}});
  /* a boulder: 20Ã—19, its foot (the ground row) 17, the middle 10. Clumps of rounded stone [cx,cy,rx,ry] (flat below their middle:
     they sit on the ground), lit as ellipsoids from the upper left, broken into facets, a crease where one stands before another,
     darker at the foot, a crack or two; by climate snow on the tops (frost), strata (desert), moss (swamp), lichen (grass) */
  const BOULDERS=[[[10,10.5,7.5,6.5],[15.6,14.6,3.2,2.6]],[[9,9.2,5.6,7.8],[13.4,12.8,4.4,4.6]],[[7.4,11.6,5.4,5.4],[13.6,12.2,5,4.8],[10.4,7.6,4.6,4]]];
  function boulderSprite(clim,v){const P=PX.GROUND_PAL[clim]||PX.GROUND_PAL.grass,RK=P.rock,W=20,H=19,F=17,Cl=BOULDERS[v%3],R=PX.dice(PX.rng(v*37+clim.length*5+11));
    const T=new Int8Array(W*H).fill(-1),O=new Int8Array(W*H).fill(-1),L=[-.52,-.62,.59];
    for(let y=0;y<=F;y++)for(let x=0;x<W;x++){let id=-1,nx=0,ny=0;Cl.forEach(([cx,cy,rx,ry],i)=>{const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;if(dx*dx+(dy>0?dy*dy*dy*dy:dy*dy)<=1){id=i;nx=dx;ny=dy}});if(id<0)continue;
      // (the facets: the normal turned by a coarse noise, so the stone reads as split planes, not a ball)
      const fx=nx+(PX.hash(x>>1,y>>1,v+31)-.5)*.42,fy=(ny>0?ny*.5:ny)+(PX.hash(x>>1,(y+1)>>1,v+32)-.5)*.34,nz=Math.sqrt(Math.max(.05,1-fx*fx-fy*fy)),nl=Math.hypot(fx,fy,nz);
      let lam=(fx*L[0]+fy*L[1]+nz*L[2])/nl;if(F-y<2)lam-=.25;else if(F-y<4)lam-=.1;
      T[y*W+x]=lam>.78?0:lam>.5?1:lam>.2?2:lam>-.1?3:4;O[y*W+x]=id}
    // (a crease where a clump stands before the one behind it; a crack across the biggest)
    for(let y=0;y<=F;y++)for(let x=0;x<W;x++){const i=y*W+x,o=O[i];if(o<0)continue;const n=[[1,0],[0,1],[-1,0]].find(([a,b])=>{const j=(y+b)*W+x+a;return y+b<=F&&x+a>=0&&x+a<W&&O[j]>o});if(n)T[i]=Math.max(T[i],3)}
    for(let k=0;k<1+v%2;k++){let x=R.int(6,12),y=R.int(6,11);for(let s=0;s<R.int(3,5);s++){const i=y*W+x;if(O[i]<0)break;T[i]=Math.min(4,Math.max(T[i],2)+1);x+=R.chance(.5)?1:-1;y+=R.chance(.7)?1:0}}
    const C=RK.c,M=new Uint8Array(W*H),col=[null,...C];
    // (by climate: extra tones on top of the five: 6-8 snow or moss or band, 9 lichen)
    const ex=[];if(RK.s)ex.push(RK.s[0],RK.s[1],RK.s[2]);else if(RK.m)ex.push(RK.m[0],RK.m[1],RK.m[2]);else if(RK.b)ex.push(PX.mix(C[1],RK.b[0],.35),PX.mix(C[2],RK.b[0],.4),PX.mix(C[1],RK.b[1],.45));else ex.push(RK.g[0],RK.g[1],RK.g[2]);ex.push('#b4b48c');col.push(...ex);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,t=T[i];if(t<0)continue;let c=t+1;const o=Cl[O[i]],ny=(y+.5-o[1])/o[3],nh=PX.hash(x,y,v+40);
      if(RK.s){if(ny<-.25+(PX.hash(x>>1,0,v+41)-.5)*.4&&nh>.15)c=t<2?6:t<3?7:8}// (snow on the tops, a ragged lower edge)
      else if(RK.m){if(ny<-.15&&PX.hash(x>>1,y>>1,v+42)>.45||F-y<2&&nh<.4)c=t<2?6:t<4?7:8}// (moss on the tops and at the foot)
      else if(RK.b){const u=Math.floor((y+(PX.hash(x>>2,0,v+43)-.5)*2.5)/3)%3;if(u===1&&t<4)c=t<2?6:7;else if(u===2&&t<3&&nh>.3)c=8}// (strata)
      else{if(ny<-.35&&x<o[0]&&PX.hash(x>>1,y>>1,v+44)>.62)c=t<2?6:t<4?7:8;else if(nh<.04)c=9}// (grass on a ledge, lichen)
      M[i]=c}
    const s=fromMap(W,H,M,col,PX.mix(C[4],'#0c0e16',.35));s.box=boxOf(s);
    // (its ground: the shadow, the contact shade, scree round the foot; tufts (grass), a drift (frost))
    const g=PX.canvas(32,16,q=>{q.drawImage(shadowSprite(22),4,3);q.fillStyle='rgba(8,14,24,.28)';for(let x=-7;x<=8;x++)q.fillRect(10+x,10+(Math.abs(x)>5?0:1),1,1);
      const Pq=PX.paint(q);for(let k=0;k<3+v%2;k++){const sx=10+[-9,9,4,-5,12][k],sy=9+[-1,0,2,2,-2][k];Pq.rect(C[2],sx,sy,2,1);Pq.px(C[1],sx,sy);Pq.px(C[3],sx+1,sy+1)}
      if(RK.s){Pq.rect(RK.s[1],3,12,7,1);Pq.rect(RK.s[0],4,11,5,1)}else if(RK.g){const TU=P.tuft;for(const [a,b] of [[-9,9],[10,8],[2,12]])for(let s2=0;s2<3;s2++){const h=2+(s2&1);for(let k=0;k<h;k++)Pq.px(k===h-1?TU[0]:k?TU[1]:TU[2],10+a+s2-1,b-k)}}});
    return{s,ax:10,ay:14,box:s.box,g,gx:10,gy:6}}
  /* a cactus: 16Ã—24, its foot row 22, the middle 8: v%3 0 a saguaro with two arms, 1 a taller one with one, a bloom on top; 2 a
     barrel cactus and a small one by it, a crown of flowers. Ribbed (lit left, shaded right), spines in light specks */
  function cactusSprite(v){const W=16,H=24,F=22,M=new Uint8Array(W*H),set=(x,y,t)=>{if(x>=0&&y>=0&&x<W&&y<=F)M[y*W+x]=t};
    // (a ribbed column x0..x0+w-1 from y0 down to y1, rounded on top: its tones by column, lit from the left)
    const col=(x0,w,y0,y1)=>{const prof=w>=5?[1,2,1,3,4]:w===4?[1,2,3,4]:[1,2,4];for(let y=y0;y<=y1;y++)for(let i=0;i<w;i++){if(y===y0&&(i===0||i===w-1))continue;set(x0+i,y,prof[i]+(y===y0&&i<w-1?-1:0)||1)}};
    const row=(x0,x1,y0,h)=>{for(let x=x0;x<=x1;x++)for(let j=0;j<h;j++)set(x,y0+j,j===0?2:j===h-1?4:3)};
    const k=v%3;
    if(k===0){col(6,5,3,F);row(3,6,13,3);col(2,3,7,15);row(10,12,10,3);col(11,3,4,12);if(v>2){set(8,2,6);set(7,3,7);set(9,3,7)}}
    else if(k===1){col(6,5,1,F);row(10,12,9,3);col(11,3,3,11);set(8,0,6);set(7,1,7);set(9,1,6)}
    else{// (barrel: a squat drum ribbed top to bottom, flat on the ground, a crown of flowers; a small one beside it)
      const drum=(cx,y0,hw0)=>{const hh=F-y0+1;for(let y=y0;y<=F;y++){const q=(y-y0+.5)/hh*2-1,hw=Math.max(1,Math.round(hw0*Math.sqrt(Math.max(0,1-q*q*q*q))));
        for(let x=cx-hw;x<cx+hw;x++){const u=(x-(cx-hw)+.5)/(2*hw),gr=(x-cx+16)%2===1&&u>.15&&u<.85;set(x,y,Math.min(4,(u<.3?1:u<.6?2:u<.85?3:4)+(gr?1:0)-(y===y0&&u<.7?1:0))||1)}}};
      drum(6,11,4.4);drum(12,17,2.4);for(const [x,c] of [[4,6],[5,7],[6,6],[7,7]])set(x,10,c)}
    // (spines: light specks along the lit ribs and the edges)
    for(let y=0;y<=F;y++)for(let x=0;x<W;x++){const t=M[y*W+x];if(t>=1&&t<=4&&(t===1||!M[y*W+x+1]||!M[y*W+x-1])&&PX.hash(x,y,v+51)<.16)M[y*W+x]=5}
    const s=fromMap(W,H,M,[null,CACTUS[0],CACTUS[1],CACTUS[2],CACTUS[3],'#f2ead0','#e8607a','#f6d04a'],PX.mix(CACTUS[4],'#0c0e16',.3));s.box=boxOf(s);
    const g=PX.canvas(24,12,q=>{q.drawImage(shadowSprite(k===2?16:14),6,2);q.fillStyle='rgba(8,14,24,.28)';for(let x=-4;x<=4;x++)q.fillRect(8+x,6,1,1)});
    return{s,ax:8,ay:21,box:s.box,g,gx:8,gy:4}}
  // a tree as an obstacle: PX.battleTree on the point, its shadow and roots as a standing tree's (battleGround)
  function obstacleTree(clim,v){const P=PX.GROUND_PAL[clim]||PX.GROUND_PAL.grass,sp=clim==='frost'?'pine':clim==='desert'?'palm':clim==='swamp'?(v%2?'dead':'willow'):v<4?'oak':'birch',s=treeSprite32(clim,sp,v%3);
    const g=PX.canvas(32,16,q=>{q.drawImage(shadowSprite(sp==='palm'||sp==='dead'?14:22),5,2);if(clim==='frost'||sp==='palm')return;const Pq=PX.paint(q),h=PX.hash(v,sp.length,23);
      Pq.px(P.trunk[1],7,7);Pq.px(P.trunk[1],13,7);if(h>.4){Pq.px(P.trunk[1],6,8);Pq.px(P.trunk[0],7,6)}if(h<.7)Pq.px(P.trunk[1],14,8)});
    return{s,ax:16,ay:30,box:s.box,g,gx:10,gy:6}}
  PX.battleObstacle=(kind,clim,v)=>{clim=PX.GROUND_PAL[clim]?clim:'grass';v=((v|0)%6+6)%6;const k=kind+clim+v;
    return OBST[k]||(OBST[k]=kind==='tree'?obstacleTree(clim,v):kind==='cactus'?cactusSprite(v):boulderSprite(clim,v))};
  /* the desert's life (battleGround's decor: nothing collides): PX.desertSprite(k,v): {s, ax, ay (its foot in s), box, sh (its
     shadow's width; g, gx, gy: a cactus's own ground)}, v 0-5 the look. saguaro and barrel: the obstacle cactus's (2 arms, 1 arm and
     a bloom; a barrel and a small one); young (a saguaro with no arms yet, now and then a bloom), pear (a prickly pear's pads, fruit
     now and then), dead (a dead shrub: bare grey twigs), dry (a dry shrub: a tangle of sage), skull (an ox skull, bleached), ribs (a
     ribcage), rocks (two or three small sandstone stones), grass and green (an oasis's tall grass and a green shrub). Lit from the
     upper left; kept, one a kind and look; seeded */
  const DSPR={},PEAR=['#a4c070','#7ea65a','#5a8644','#3c6434'],SAGE=['#c8bc72','#a09a52','#76743e','#4e4e2c'],TWIG=['#9a8a72','#74644e','#4e4236'],
    BONE=['#f6f0e0','#dcd2b8','#aea284','#5e5444','#e6dcc2','#8a7c64'],OASG=['#a6c45a','#7aa444','#56823a','#38602e','#e2d67a'],DSH={young:7,pear:13,dead:11,dry:12,skull:0,ribs:9,rocks:9,grass:8,green:12};
  const SKULL=['t............t','hh..........hh','.hhh111112hhh.','...11111122...','...14111142...','....112222....','....122223....','.....2233.....'];
  PX.desertSprite=(k,v)=>{v=((v|0)%6+6)%6;const key=k+v;if(DSPR[key])return DSPR[key];
    if(k==='saguaro'||k==='barrel'){const c=PX.battleObstacle('cactus','desert',k==='barrel'?2+3*(v&1):[0,1,3,4][v%4]);return DSPR[key]={s:c.s,ax:c.ax,ay:c.ay,box:c.box,g:c.g,gx:c.gx,gy:c.gy}}
    const [W,H,ax,ay]={young:[8,16,4,14],pear:[18,15,8,13],dead:[17,13,8,11],dry:[14,11,7,9],skull:[14,9,7,7],ribs:[17,10,8,8],rocks:[13,8,6,6],grass:[13,13,6,11],green:[15,12,7,10]}[k];
    const M=new Uint8Array(W*H),R=PX.dice(PX.rng(v*61+k.length*7+5)),hs=(x,y,s)=>PX.hash(x,y,v*5+s+k.length*3);
    const set=(x,y,t)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H)M[y*W+x]=t};
    const line=(x0,y0,x1,y1,t)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)set(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,typeof t==='function'?t(i,n):t)};
    // (ellipses [cx,cy,rx,ry], later over earlier, each lit as a dome from its upper left (tones 1-4); sit: flat below its middle)
    const dome=(L,sit,j=.3)=>{for(const [cx,cy,rx,ry] of L)for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;if(dx*dx+(sit&&dy>0?dy*dy*dy*dy:dy*dy)>1)continue;
      const l=-dx*.6-dy*.7+(hs(x,y,1)-.5)*j;set(x,y,l>.45?1:l>-.05?2:l>-.5?3:4)}};
    let col,rim=null;
    if(k==='young'){const y0=14-R.int(8,11);for(let y=y0;y<=14;y++)for(let i=0;i<4;i++){if(y===y0&&(i===0||i===3))continue;set(2+i,y,i+1-(y===y0&&i<3?1:0)||1);if(i<3&&hs(i,y,2)<.16)set(2+i,y,5)}
      if(v%3===0){set(3,y0-1,6);set(4,y0-1,7)}col=[null,...CACTUS.slice(0,4),'#f2ead0','#e8607a','#f6d04a'];rim=PX.mix(CACTUS[4],'#0c0e16',.3)}
    else if(k==='pear'){// (pads: the top ones first, the front one at its foot last; each ringed dark on its lower right, spines in specks, fruit on top)
      const o=v%3-1,L=[[8+o,4.4,2.6,3.1],[4.6+o*.4,7.6,2.8,3.4],[12.4,7.2+o*.5,2.9,3.4],...(v>2?[[14.6,10.8,2.2,2.5]]:[]),[8.5,10.2,3.4,3.6]];
      for(const [cx,cy,rx,ry] of L)for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,e=dx*dx+dy*dy;if(e>1)continue;const l=-dx*.6-dy*.6;
        set(x,y,e>.66&&(dx>0||dy>0)?4:l>.35?1:l>-.25?2:3);if(e<.66&&hs(x,y,3)<.1)set(x,y,5)}
      if(v%2===0)for(const [cx,cy,,ry] of L.slice(0,3)){set(cx-1,cy-ry,6);set(cx,cy-ry-.6,7)}col=[null,...PEAR,'#e8eccc','#a83a5e','#e07890'];rim=PX.mix(PEAR[3],'#0c0e16',.4)}
    else if(k==='dead'){const s=v&1?1:-1;// (bare boughs out of a gnarled foot, a fork on each, bleached on their lit side)
      for(const [x1,y1,f] of [[2,5,1],[14,4,1],[8+s,1,1],[1,9,0],[15,8,0],[5,2,0],[11,2,0]]){if(!f&&hs(x1,y1,3)<.4)continue;line(8,11,x1,y1,(i,n)=>i<n*.3?3:x1<8||y1<3?1:2);
        const mx=Math.round(8+(x1-8)*.6),my=Math.round(11+(y1-11)*.6);line(mx,my,mx+(x1<8?-2:2),my-2,2)}set(7,11,3);set(9,11,3);set(8,10,3);col=[null,...TWIG]}
    else if(k==='dry'){// (a sage tangle: a lacy dome, a few stiff twigs out of it, its foot dark)
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x+.5-7)/5.6,dy=(y+.5-5.6)/4.2,e=dx*dx+dy*dy;if(e>1||hs(x,y,4)<.18+e*.25)continue;const l=-dx*.6-dy*.7+(hs(x,y,5)-.5)*.5;set(x,y,l>.5?1:l>0?2:l>-.5?3:4)}
      for(let n=0;n<4;n++){const a=R.R()*6.28;line(7+Math.cos(a)*2,5.6+Math.sin(a)*1.6,7+Math.cos(a)*6,5.6+Math.sin(a)*4.2,3)}for(let x=5;x<=9;x++)set(x,9,4);col=[null,...SAGE]}
    else if(k==='skull'){SKULL.forEach((r,y)=>{for(let x=0;x<W;x++){const c=r[v&1?W-1-x:x];if(c!=='.')set(x,y,c==='h'?5:c==='t'?6:+c)}});if(v>2)set(0,0,0);col=[null,...BONE];rim='#6e624e'}
    else if(k==='ribs'){// (a ribcage on its side: the spine along the ground, ribs bowing up from it, one broken now and then)
      for(let x=2;x<=14;x++)set(x,8,x%2?2:3);for(let r=0;r<5;r++){if(v&1&&r===3)continue;const x0=3+r*2.4,h=5.6-r*.5;for(let y=7;y>=8-h;y--){const u=(8-y)/h;set(x0+2.2*Math.sin(u*Math.PI*.85),y,u<.5?1:2)}}
      col=[null,...BONE];rim='#6e624e'}
    else if(k==='rocks'){const RK=PX.GROUND_PAL.desert.rock.c;dome([[[4.5,4,3.6,2.8],[9.4,5,2.4,1.9]],[[6,3.8,4,3],[10.6,5.6,1.4,1.1]],[[3.6,5,2.2,1.7],[7.2,4,3,2.6],[10.6,5.4,1.6,1.3]]][v%3],true);col=[null,...RK.slice(0,4)];rim=PX.mix(RK[4],'#0c0e16',.35)}
    else if(k==='grass'){const n=7+v%3;// (blades fanning out of a tuft, light at their tips, seed heads now and then)
      for(let j=0;j<n;j++){const d=j-(n-1)/2,h=6+Math.floor(hs(j,0,6)*5),x1=6+d*1.9+(hs(j,1,6)-.5)*2;line(6+d*.7,11,x1,11-h,(i,m)=>i<m*.3?3:i<m*.75?2:1);if(v%2&&j%3===0)set(x1,11-h,5)}col=[null,...OASG]}
    else{dome([[7.5,6.5,4.6,3.8],[4.4,7.8,3,2.6],[10.8,7.6,3.2,2.7],[7,3.6,3,2.4]],false,.5);if(v%3===0)for(let n=0;n<3;n++)set(4+n*3,4+(n&1)*2,5);col=[null,...OASG.slice(0,4),'#f0ece0'];rim=PX.mix(OASG[3],'#0c0e16',.35)}
    const s=fromMap(W,H,M,col,rim);return DSPR[key]={s,ax,ay,box:boxOf(s),sh:DSH[k]}};

  // the plain climate ground (when the game gives no base: the gallery), and the desert's own bare ground under a base (from row
  // y0: the arena's top band kept). A generator: it yields every band of rows (battleGroundSteps). WR: a window [x0,y0,x1,y1] (its
  // x0 a multiple of 4), D its pixels; none: the field (each odd row reads its even row's noise: the same in a window)
  function* plainGround(D,W,H,P,seed,y0,WR){const [X0,Y0,X1,Y1]=WR||[0,0,W,H],SW=X1-X0,B=P.base.map(hx),N=noise(W,H,64,seed+40,WR),N2=noise(W,H,24,seed+42,WR),band=bandRows(SW,!!WR),ys=Math.max(y0||0,Y0);
    const RV=new Float32Array(SW);let nv=0,bh=0;for(let y=ys;y<Y1;y++){if(y>ys&&!(y%band))yield;const ry=!(y&1)||y===y0?y:y-1,fresh=ry===y||y===ys;for(let x=X0;x<X1;x++){if(!(x&1)){if(fresh)RV[x-X0]=.6*(N(x,ry)-.5)+.25*(N2(x,ry)-.5);nv=RV[x-X0]}if(!(x&3))bh=.2*(PX.hash(x>>2,y>>2,seed+41)-.5);
      let v=.5+nv+bh;v=v<0?0:v>1?1:v;const lo=v<.5,a=lo?B[0]:B[1],b=lo?B[1]:B[2],t=lo?v*2:(v-.5)*2,o=((y-Y0)*SW+x-X0)*4;
      D[o]=a[0]+(b[0]-a[0])*t;D[o+1]=a[1]+(b[1]-a[1])*t;D[o+2]=a[2]+(b[2]-a[2])*t;D[o+3]=255;
      const ph=PX.hash(x,y,seed+43);if(ph<.03){const c=B[2];D[o]+=(c[0]-D[o])*.6;D[o+1]+=(c[1]-D[o+1])*.6;D[o+2]+=(c[2]-D[o+2])*.6}else if(ph>.97){const c=B[0];D[o]+=(c[0]-D[o])*.7;D[o+1]+=(c[1]-D[o+1])*.7;D[o+2]+=(c[2]-D[o+2])*.7}}}}
  // (the rows of a band: about PX.GROUND_BAND pixels, at least one row; a tile's (R16, painted a few ms a frame): an eighth of that)
  PX.GROUND_BAND=1<<17;const bandRows=(W,tile)=>Math.max(1,Math.floor((tile?PX.GROUND_BAND>>3:PX.GROUND_BAND)/W));

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

  /* the plain field's small things (the game's arena: a battle's ground without terrain, and the base a terrain is painted over):
     the climate's open-ground details (P.detail, as battleGround paints them) on each 16-px cell from row 16 down, and in the swamp
     still pools, a mud rim, the far bank's shade, a glint, reeds at an end now and then; seeded by the cell, never Math.random.
     rc: [x0,y0,x1,y1], only what reaches into it (a tile's, R16): the same pixels there */
  PX.battleDetails=(g,W,H,clim,seed,rc)=>{const P=PX.GROUND_PAL[clim]||PX.GROUND_PAL.grass,Pg=PX.paint(g),C=Math.ceil(W/16),R=Math.ceil(H/16),h=(i,j,k)=>PX.hash(i,j,seed*13+k),out=(x0,y0,x1,y1)=>rc&&(x1<rc[0]||x0>=rc[2]||y1<rc[1]||y0>=rc[3]);
    if(clim==='swamp')for(let k=0,n=Math.max(6,Math.round(W*H/80000));k<n;k++){const w=14+Math.floor(h(k,1,1)*13),ph=5+Math.floor(h(k,2,1)*3),x0=Math.floor(h(k,3,1)*(W-w-4))+2,y0=24+Math.floor(h(k,4,1)*(H-ph-30));if(out(x0-12,y0-12,x0+w+12,y0+ph+12))continue;
      for(let y=-1;y<=ph;y++)for(let x=-1;x<=w;x++){const dx=(x+.5-w/2)/(w/2+1),dy=(y+.5-ph/2)/(ph/2+1),e=dx*dx+dy*dy,cut=PX.hash(x0+x,y0+y,seed+5)*.12;if(e>1-cut)continue;
        const ix=(x+.5-w/2)/(w/2),iy=(y+.5-ph/2)/(ph/2),wet=ix*ix+iy*iy<=1-cut,top=wet&&ix*ix+((y-.5-ph/2)/(ph/2))**2>1-cut;
        Pg.px(!wet?P.mud:top?P.bank:iy<-.1?P.water[2]:P.water[1],x0+x,y0+y)}
      Pg.rect(P.glint,x0+(w>>1)-1,y0+(ph>>1)+1,2,1);if(h(k,5,1)<.5)reeds(Pg,x0+(h(k,6,1)<.5?2:w-3),y0+(ph>>1),Math.floor(h(k,7,1)*99),P)}
    for(let j=1;j<R;j++)for(let i=0;i<C;i++){if(out(i*16-16,j*16-16,i*16+32,j*16+34))continue;P.detail[0].forEach(([d,ch],n)=>{if(h(i,j,n*5+1)>=ch)return;const x=i*16+2+Math.floor(h(i,j,n*5+2)*12),y=j*16+3+Math.floor(h(i,j,n*5+3)*13);
      if(y<H)DETAIL[d](Pg,x,y,Math.floor(h(i,j,n*5+4)*1000),P,g,clim)})}};
  PX.ROCK_PX=14;// (a level of a mountain's height, px: spec.rockH × this, unless spec.rockPx)
  /* R16: the field painted by tiles. PX.battleGround(spec): the whole of it as one canvas, as ever (cv.plan: what its tiles share).
     PX.battleGroundPaint(plan, [x,y,w,h], out): one rect of it (a tile), painted over a window PX.GROUND_TILE.apron px larger and
     kept to the rect: its pixels those of the whole there, pixel for pixel (tests/groundhash.js); PX.battleGroundPaintSteps the same
     as a generator. The whole is painted once (paint: it places every tree, detail and stone, and keeps them in the plan as a list
     of what is drawn, in its order), then any rect from the plan alone: the per-pixel work (height, pools, the river's reach, the
     ways' lines, colour, ways, ripples, mountains) over the window, and what is drawn over it that reaches into the rect */
  PX.battleGround=spec=>{const it=paint(spec,null);let n;while(!(n=it.next()).done);return n.value};
  PX.battleGroundPaintSteps=(plan,rc,out)=>paint(plan.spec,plan,rc,out);
  PX.battleGroundPaint=(plan,rc,out)=>{const it=paint(plan.spec,plan,rc,out);let n;while(!(n=it.next()).done);return n.value};
  // the painting: PL null, the whole field (cv, the plan made: cv.plan); else the rect rc ([x,y,w,h]) from the plan PL, onto out
  function* paint(spec,PL,rc,out){
    const C=spec.C,R=spec.R,cs=spec.cs||16,clim=PX.GROUND_PAL[spec.climate]?spec.climate:'grass',P=PX.GROUND_PAL[clim],seed=(spec.seed|0)||1,base=spec.base,
      W=base?base.width:spec.w||C*cs,H=base?base.height:spec.h||R*cs,kind0=spec.kind||new Uint8Array(C*R),lvl=spec.lvl||new Uint8Array(C*R);
    // (the desert: its marsh is an oasis; woods none. A river, 3-5, wherever the game lays one)
    const kind=kind0,oasis=!!P.oasis,bare=!P.species.length,RP=P.riv,rk=typeof spec.recipe==='string'?spec.recipe:spec.recipe&&spec.recipe.kind||'';
    // (the window: the whole field, or the rect and an apron round it, from a cell's edge; IX a pixel's place in its arrays)
    const full=!PL,[X,Y,w,h]=rc||[0,0,W,H],AP=full?0:PX.GROUND_TILE.apron,WX0=Math.max(0,Math.floor((X-AP)/cs)*cs),WY0=Math.max(0,Math.floor((Y-AP)/cs)*cs),WX1=Math.min(W,X+w+AP),WY1=Math.min(H,Y+h+AP),
      SW=WX1-WX0,SH=WY1-WY0,WR=full?null:[WX0,WY0,WX1,WY1],IX=(x,y)=>(y-WY0)*SW+x-WX0,inW=(x,y)=>x>=WX0&&y>=WY0&&x<WX1&&y<WY1;
    // (the plan the whole makes: the spec, each way's climbs, the highest peak, what is drawn (L) and what its records point at)
    const PLn=full?{spec,clb:[],zm:0}:null;
    // (the base under the window (the climate's arena, painted in steps, or a canvas): the whole's into its canvas, a rect's on one
    // the window's size; over a desert's own ground only its top band is kept, so only that is painted)
    const own=!base||P.plain,bh=own?Math.max(0,Math.min(15,WY1)-WY0):SH,cv=out||PX.canvas(w,h),bc=full?cv:base?PX.canvas(SW,SH):null,g0=bc&&bc.getContext('2d');
    if(base&&bh){if(base.getContext)g0.drawImage(base,-WX0,-WY0);else yield* base.paintSteps(g0,WX0,WY0,SW,bh,full?PX.GROUND_BAND:PX.GROUND_BAND>>3)}
    const img=own?new ImageData(SW,SH):g0.getImageData(0,0,SW,SH),D=img.data;if(own){yield* plainGround(D,W,H,P,seed,base?15:0,WR);if(base&&bh)D.set(g0.getImageData(0,0,SW,bh).data)}
    // (how far through: stage s of GS, f through it; band: a stage's band of cell rows, run over its cells (each) a band at a time)
    const GS=9,at=(s,f)=>(s+(f||0))/GS;yield at(1);
    const cell=(a,i,j)=>a[(j<0?0:j>=R?R-1:j)*C+(i<0?0:i>=C?C-1:i)];
    // the cells worth painting: any with a level or a kind, and their neighbours (the slope and the ragged edge reach into them)
    const act=new Uint8Array(C*R);for(let j=0;j<R;j++)for(let i=0;i<C;i++)if(lvl[j*C+i]||kind[j*C+i])for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const x=i+a,y=j+b;if(x>=0&&y>=0&&x<C&&y<R)act[y*C+x]=1};
    const T=new Uint8Array(SW*SH),K=new Uint8Array(SW*SH),WT=new Uint8Array(SW*SH),F=new Uint8Array(SW*SH),Q=oasis?new Float32Array(SW*SH):null;
    const ci0=Math.floor(WX0/cs),ci1=Math.min(C,Math.ceil(WX1/cs)),cj0=Math.floor(WY0/cs),cj1=Math.min(R,Math.ceil(WY1/cs));
    const each=(f,j0=cj0,j1=cj1)=>{for(let j=j0;j<j1;j++)for(let i=ci0;i<ci1;i++){if(!act[j*C+i])continue;const y1=Math.min(WY1,(j+1)*cs),x1=Math.min(WX1,(i+1)*cs);for(let y=j*cs;y<y1;y++)for(let x=i*cs;x<x1;x++)f(x,y,(y-WY0)*SW+x-WX0)}};
    const BR0=Math.max(1,Math.floor(bandRows(SW,!full)/cs)),band=function*(s,f){for(let j=cj0;j<cj1;j+=BR0){each(f,j,Math.min(cj1,j+BR0));yield at(s,Math.min(1,(j-cj0+BR0)/(cj1-cj0)))}};
    // (1) height: the cells' levels, bilinear between cell centres, sampled through a gentle wobble (±3.5 px), so a terrace edge
    //     sits on its cells' edge but runs as a natural line; the terrace is the height rounded. Woods and marsh: the same, through
    //     a pixel-fine wobble too (their ragged edge); an oasis keeps its share (Q: pool, bank and green by how far in)
    const NX=noise(W,H,8,seed,WR),NY=noise(W,H,8,seed+1,WR),NP=noise(W,H,10,seed+5,WR),NQ=noise(W,H,5,seed+6,WR);
    // (1b) a river: its cells' water and depth blurred [1 2 1]² and read through the same wobble, so a bank runs as a curve through
    //      a meander's steps yet sits on its cells' edge. WV: 0 land, 1 ford, 2 deep (a bridge's cells are deep under its deck)
    const hasW=kind.some(k=>k>=3&&k<=5),WV=hasW?new Uint8Array(SW*SH):null,bil=(A,iu,iv,fu,fv)=>{const a=cell(A,iu,iv),b=cell(A,iu+1,iv),c=cell(A,iu,iv+1),d=cell(A,iu+1,iv+1);return a+(b-a)*fu+(c-a)*fv+(a-b-c+d)*fu*fv};
    const blur=f=>{const A=new Float32Array(C*R);for(let j=0;j<R;j++)for(let i=0;i<C;i++){let s=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)s+=f(cell(kind,i+a,j+b))*(a?1:2)*(b?1:2);A[j*C+i]=s/16}return A};
    const WB=hasW?blur(k=>k>=3&&k<=5?1:0):null,DB=hasW?blur(k=>k===4||k===5?1:0):null;// (6, rock, is no water)
    yield* band(1,(x,y,o)=>{const jx=(NX(x,y)-.5)*7,jy=(NY(x,y)-.5)*7,sx=x+.5+jx,sy=y+.5+jy,u=sx/cs-.5,v=sy/cs-.5,iu=Math.floor(u),iv=Math.floor(v),fu=u-iu,fv=v-iv;
      const a=cell(lvl,iu,iv),b=cell(lvl,iu+1,iv),c=cell(lvl,iu,iv+1),d=cell(lvl,iu+1,iv+1),h=a+(b-a)*fu+(c-a)*fv+(a-b-c+d)*fu*fv;T[o]=h>=1.5?2:h>=.5?1:0;
      if(hasW){const wu=(x+.5+jx*.6)/cs-.5,wv=(y+.5+jy*.6)/cs-.5,ku=Math.floor(wu),kv=Math.floor(wv);if(bil(WB,ku,kv,wu-ku,wv-kv)>.5){WV[o]=bil(DB,ku,kv,wu-ku,wv-kv)>.5?2:1;return}}
      const qu=(sx+(PX.hash(x,y,seed+2)-.5)*3)/cs-.5,qv=(sy+(PX.hash(x,y,seed+3)-.5)*3)/cs-.5,ku=Math.floor(qu),kv=Math.floor(qv),wu=qu-ku,wv=qv-kv;
      const k0=cell(kind,ku,kv),k1=cell(kind,ku+1,kv),k2=cell(kind,ku,kv+1),k3=cell(kind,ku+1,kv+1),w0=(1-wu)*(1-wv),w1=wu*(1-wv),w2=(1-wu)*wv,w3=wu*wv;
      const s1=(k0===1?w0:0)+(k1===1?w1:0)+(k2===1?w2:0)+(k3===1?w3:0);if(s1>.5){K[o]=1;return}const s2=(k0===2?w0:0)+(k1===2?w1:0)+(k2===2?w2:0)+(k3===2?w3:0);if(Q)Q[o]=s2+(NP(x,y)-.5)*.14;if(s2>.5)K[o]=2});
    // (2) marsh pools: a blotchy noise over the marsh, kept a few pixels inside it; an oasis: one pool in its heart
    const Kat=(x,y)=>inW(x,y)?K[IX(x,y)]:0;
    yield* band(2,(x,y,o)=>{if(oasis){const q=Q[o];if(q>.88)WT[o]=q>.95?2:1;return}if(K[o]!==2)return;const n=NP(x,y)*.8+NQ(x,y)*.2;if(n>.6&&Kat(x,y-4)===2&&Kat(x,y+4)===2&&Kat(x-5,y)===2&&Kat(x+5,y)===2)WT[o]=n>.68?2:1});
    // (1c) the river's reach: each water pixel's distance to land (DW) and each land pixel's to water (DL), chamfer 3-4 (3 a px),
    //      in its cells' box; which way it flows (down the field, or across: flowV) and its middle's slope a row (the current's lean)
    let DW=null,DL=null,flowV=true,bx0=0,by0=0,bx1=0,by1=0;const SLP=new Float32Array(Math.max(C,R));
    if(hasW){let c0=C,c1=-1,r0=R,r1=-1,nr=0,nc=0;const rows=new Float32Array(R),rn=new Uint16Array(R),cols=new Float32Array(C),cn=new Uint16Array(C);
      for(let j=0;j<R;j++)for(let i=0;i<C;i++)if(kind[j*C+i]>=3&&kind[j*C+i]<=5){if(i<c0)c0=i;if(i>c1)c1=i;if(j<r0)r0=j;if(j>r1)r1=j;rows[j]+=i;rn[j]++;cols[i]+=j;cn[i]++}
      for(let j=0;j<R;j++)if(rn[j])nr++;for(let i=0;i<C;i++)if(cn[i])nc++;flowV=nr>=nc;
      const L=flowV?R:C,cnt=flowV?rn:cn,sum=flowV?rows:cols,mid=k=>{for(let d=0;d<L;d++){if(k-d>=0&&cnt[k-d])return sum[k-d]/cnt[k-d];if(k+d<L&&cnt[k+d])return sum[k+d]/cnt[k+d]}return 0};
      for(let k=0;k<L;k++)SLP[k]=(mid(k+1)-mid(k-1))/2;
      bx0=Math.max(0,(c0-1)*cs);by0=Math.max(0,(r0-1)*cs);bx1=Math.min(W,(c1+2)*cs);by1=Math.min(H,(r1+2)*cs);
      // (over the box within the window: a distance under the apron is the field's own)
      const ax0=Math.max(bx0,WX0),ay0=Math.max(by0,WY0),ax1=Math.min(bx1,WX1),ay1=Math.min(by1,WY1);
      const cham=src=>{const A=new Uint16Array(SW*SH).fill(999);
        for(let y=ay0;y<ay1;y++)for(let x=ax0;x<ax1;x++){const i=IX(x,y);if(src(i)){A[i]=0;continue}let m=A[i];if(x>ax0)m=Math.min(m,A[i-1]+3);if(y>ay0){m=Math.min(m,A[i-SW]+3);if(x>ax0)m=Math.min(m,A[i-SW-1]+4);if(x<ax1-1)m=Math.min(m,A[i-SW+1]+4)}A[i]=m}
        for(let y=ay1-1;y>=ay0;y--)for(let x=ax1-1;x>=ax0;x--){const i=IX(x,y);let m=A[i];if(!m)continue;if(x<ax1-1)m=Math.min(m,A[i+1]+3);if(y<ay1-1){m=Math.min(m,A[i+SW]+3);if(x<ax1-1)m=Math.min(m,A[i+SW+1]+4);if(x>ax0)m=Math.min(m,A[i+SW-1]+4)}A[i]=m}
        return A};
      DW=cham(i=>!WV[i]);DL=cham(i=>WV[i]>0);yield at(3)}
    // (Wv: the river at a pixel, 255 off the field; dn, upw: k px down or up its flow; Dl: a pixel's distance to it, chamfer units.
    //  Off the window as off the field: only the apron reads there)
    const Wv=(x,y)=>inW(x,y)?WV[IX(x,y)]:255,dn=(x,y,k)=>flowV?Wv(x,y+k):Wv(x+k,y),upw=(x,y,k)=>flowV?Wv(x,y-k):Wv(x-k,y),Dl=(x,y)=>hasW&&inW(x,y)?DL[IX(x,y)]:999;
    const Wat=(x,y)=>inW(x,y)?WT[IX(x,y)]:0,Tat=(x,y)=>inW(x,y)?T[IX(x,y)]:0,Fat=(x,y)=>inW(x,y)?F[IX(x,y)]:1;
    const TRK0=hx(P.trunk[0]),TRK1=hx(P.trunk[1]),FC=P.face.map(hx),HI=hx(P.hi),LO=hx(P.lo),LN=hx(P.line),UN=hx(P.under),LF=hx(P.leaf[2]),MU=hx(P.mud),BK=hx(P.bank),WA=P.water.map(hx),GR=(P.green||P.leaf).map(hx);
    const mix=(o,c,t)=>{D[o]+=(c[0]-D[o])*t;D[o+1]+=(c[1]-D[o+1])*t;D[o+2]+=(c[2]-D[o+2])*t},put=(o,c)=>{D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2]};
    // the river's own colours (RW: its water light to deep; DEEP: the deep's tones by depth; FORD: shallow over gravel; BEDL: a bar)
    const RW=RP.w.map(hx),BED=hx(RP.bed),FOAM=hx(RP.foam),E=RP.earth.map(hx),ICE=RP.ice?RP.ice.map(hx):null,SN=hx('#f4f8fc'),ST=RP.stone.map(hx),WEED=hx('#5e6e34');
    const lerp=(a,b,t)=>a.map((v,z)=>v+(b[z]-v)*t),DEEP=[lerp(RW[0],RW[1],.55),RW[1],RW[2],RW[3]],FORD=lerp(RW[0],BED,.42),BEDL=lerp(BED,hx(P.hi),.25),NB=hasW?noise(W,H,12,seed+60,WR):null;
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
    // ramp: the cliff breaks there and the hillside slopes down through the gap (rampPx). No spec.wall: every edge as before (a face, climbable)
    const WL=spec.wall&&spec.wall.length===C*R?spec.wall:null,FHS=12,RC=(P.rock||PX.GROUND_PAL.grass.rock).c.map(hx),FOOTS=[.7,.62,.54,.46,.38,.3,.2,.1];
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
    /* a ramp (an edge of a cliff-ringed plateau with no cliff: kindOf 2), purely natural: the cliff breaks there and the hillside
       simply slopes down through the gap, as tall as the cliff beside it (FHS a level): its own ground and grass shaded in four steps
       from the plateau's light down to the ground's, the earth showing through a little in its middle (worn, lighter), grass tufts,
       its sides blending in (the west in shade, the east lit); a few loose stones of scree in a soft fan at its foot; the face's end
       each side a rock shoulder (the west one's in shade, the east one's lit). By climate (snow lying over it in the frost, sand in
       the desert, mud and moss in the swamp). Its pixels are F 4 (no face prop; nothing stands there). rampPx: a pixel of it, v
       down the climb (0 its top, 1 its foot), e px in from its side (rampSide), lit: -1 the shaded side, 1 the lit one; rampFan:
       the ground below its foot, f how strong (1 at its foot) */
    const RGN=(PX.GROUND_PAL[clim].rock||{}),REA=hx((WAYPAL[clim]||WAYPAL.grass).c[1]),RSTN=RC[1],RSTD=RC[3],RMOSS=RGN.m?hx(RGN.m[1]):null,RSNOW=clim==='frost'?hx('#f4f8fc'):null,RSHD=[.03,.11,.19,.27];
    const rampPx=(o,x,y,i,v,e,lit)=>{const h=PX.hash(x,y,seed+16),n=NP(x,y),k=Math.min(3,Math.floor(Math.max(0,v)*4));mix(o,LO,RSHD[k]);
      if(e>=2&&n>.38)mix(o,REA,Math.min(.55,(n-.38)*2)*Math.min(1,(e-1)/3));// (the earth through it, its middle worn)
      if(RSNOW&&NQ(x,y)>.35)mix(o,RSNOW,.45);if(RMOSS&&h<.18)mix(o,RMOSS,.35);
      if(h<.05)put(o,TU[h<.02?0:1]);else if(h>.985&&v>.4)put(o,RSTN);
      if(lit<0&&e<4)mix(o,LO,.2*(1-e/4));else if(lit>0&&e<3)mix(o,HI,.07);F[i]=4};
    const rampFan=(o,x,y,i,f,e)=>{const sd=Math.min(1,(e+1)/4);mix(o,LO,.1*f*sd);if(NP(x,y)>.42)mix(o,REA,.3*f*sd);if(f>.35)F[i]=4;const h=PX.hash(x,y,seed+19);if(h<.05*f){put(o,RSTN);if(y+1<WY1)mix(o+SW*4,RSTD,.5)}else if(h>.97)put(o,TU[1])};
    // (how far in from its side a ramp pixel lies: the edge b under (x,y) is a ramp, and so on k px either way along it, up to 4)
    const rampSide=(b,x,y)=>{const ax=b===2||b===8;for(let k=1;k<=4;k++)if(edgeK(b,ax?x-k:x,ax?y:y-k)!==2||edgeK(b,ax?x+k:x,ax?y:y+k)!==2)return k-1;return 4};
    // a plateau pixel with walls known: its south face (sheer: rock in FHS-px levels; a slope: graded, in steps), the rim over it,
    // its east wall (sheer 4 px a level, else 3) and west (2, else 1), its north lip; true: painted
    const wlTop=(o,x,y,i,t,d1,st)=>{
      const ek=d1?edgeK(2,x,y+d1):0;if(ek){const sh=ek===1,fh=FHS*st;
        if(d1<=fh){const f=(fh-d1)/(fh-1),h=PX.hash(x,y,seed+12);
          if(ek===2){const e=rampSide(2,x,y+d1);rampPx(o,x,y,i,1-f,e,e<4&&edgeK(2,x-e-1,y+d1)!==2?-1:1);return true}
          if(sh){F[i]=1;let k=f<.1?1:f<.4?2:f<.75?3:4;const led=(d1+((x>>4)&1)*2)%5===0&&h>.25;
            if(PX.hash(x,(y+d1)>>4,seed+14)<.16&&PX.hash(x,y>>2,seed+15)<.8)k=Math.min(4,k+1);else if(led&&k>1)k--;// (cracks down it, ledges across)
            put(o,RC[k]);if(RB){const bd=Math.floor((d1+((x>>3)&1))/3)%3;mix(o,RB[bd],bd===1?.18:.3)}
            if(SNW&&led&&h>.45)put(o,SNW[f<.5?0:1]);if(h>.96)put(o,RC[Math.max(0,k-1)]);
            if(d1===fh){put(o,RC[0]);mix(o,HI,.5)}else if(d1===fh-1)put(o,RC[1]);
            for(let k=1;k<=2;k++){if(edgeK(2,x+k,y+d1)===2){put(o,RC[k===1?4:3]);break}if(edgeK(2,x-k,y+d1)===2){put(o,RC[k===1?0:1]);if(k===1)mix(o,HI,.3);break}}// (a shoulder by a ramp)
            return true}}
        if(ek===2&&d1<=fh+2)return true;// (no lit rim over a ramp: the hillside runs on)
        if(d1<=fh+2){mix(o,HI,d1===fh+1?.75:.35);return true}}
      for(let d=1;d<=8;d++){const u=Tat(x+d,y);if(u<t){const ek=edgeK(1,x+d,y),sh=ek===1;if(ek===2&&d<=4*(t-u)+3){rampPx(o,x,y,i,(4*(t-u)+3-d)/(4*(t-u)+3),rampSide(1,x+d,y),0);return true}if(sh&&d<=4*(t-u)){F[i]=2;put(o,RC[d===1?4:3]);if(PX.hash(x,y,seed+13)>.9)put(o,RC[2]);return true}break}}
      for(let d=1;d<=5;d++){const u=Tat(x-d,y);if(u<t){const ek=edgeK(4,x-d,y),sh=ek===1;if(ek===2&&d<=2*(t-u)+3){rampPx(o,x,y,i,(2*(t-u)+3-d)/(2*(t-u)+3),rampSide(4,x-d,y),0);return true}if(sh&&d<=2*(t-u)){F[i]=2;put(o,RC[d===1?1:2]);return true}break}}
      for(let d=1;d<=6;d++)if(Tat(x,y-d)<t){if(edgeK(8,x,y-d)===2){rampPx(o,x,y,i,(6-d)/6*.5,rampSide(8,x,y-d),0);return true}break}// (a ramp up a north edge)
      if(Tat(x,y-1)<t&&edgeK(8,x,y-1)===1){put(o,RC[1]);mix(o,HI,.3);return true}
      if(Tat(x-1,y)<t&&edgeK(4,x-1,y)===1){mix(o,HI,.25);return true}
      return false};
    // a pixel below or beside a higher one, walls known: the shadow at a cliff's foot (long) or a slope's (soft), east of a wall, a
    // north edge's outline (a cliff's thick and dark, a slope's faint)
    const wlLow=(o,x,y,t,i)=>{
      for(let d=1;d<=11;d++)if(Tat(x,y-d)>t){const k=edgeK(2,x,y-d+1);if(k===2){rampFan(o,x,y,i,1-(d-1)/11,rampSide(2,x,y-d+1));return}if(d>8||!k)break;if(d<=FOOTS.length)mix(o,LO,FOOTS[d-1]);return}
      for(let d=1;d<=9;d++)if(Tat(x-d,y)>t){const k=edgeK(1,x-d+1,y);if(k===2){rampFan(o,x,y,i,1-(d-1)/9,rampSide(1,x-d+1,y));return}if(d>3||k!==1)break;mix(o,LO,.5-.1*d);return}
      for(let d=1;d<=9;d++)if(Tat(x+d,y)>t){if(edgeK(4,x+d-1,y)===2){rampFan(o,x,y,i,1-(d-1)/9,rampSide(4,x+d-1,y));return}break}
      for(let d=1;d<=9;d++)if(Tat(x,y+d)>t){if(edgeK(8,x,y+d-1)===2){rampFan(o,x,y,i,1-(d-1)/9,rampSide(8,x,y+d-1));return}break}
      if(Tat(x,y+1)>t&&edgeK(8,x,y)===1){put(o,LN);return}
      if(Tat(x,y+2)>t&&edgeK(8,x,y+1)===1){mix(o,LN,.75);return}
      if(Tat(x,y+3)>t&&edgeK(8,x,y+2)===1){mix(o,LN,.4);return}
      slopeLow(o,x,y,t)};
    /* mountains and spires (phase 4: kind 6, impassable; spec.rockH a cell's height in levels of spec.rockPx px, ROCK_PX unless
       given; a rock cell without one is 3). Each mass (rock cells joined edge to edge) is a heightfield over its footprint (its cells
       through the same wobble): steep at its edge (a lone spire of 1-2 cells a needle), peaked by a ridged noise, the desert's
       sandstone flat-topped and sheer. Drawn front to back a column at a time, each ground point (x,y) at height z showing at
       (x,y-z), so its peaks rise up the screen over the ground behind it; half-Lambert lit from the upper left, darker toward its
       foot, cast shadows (its own, and on the ground to the lower right), scree at its foot, an outline round its silhouette and
       along each crest over the rock behind; by climate grass tufts and lichen (granite), snow above a ragged line and on its flats
       (frost), strata of ochre and red (desert), moss (swamp). Its pixels are F 3 (nothing stands there) and are returned as props
       (dk 3, run by run of one mass), drawn in depth order with the soldiers as the faces are. Returns RS: each pixel's mass (+1) */
    function* rockMasses(){const RH=spec.rockH,RPX=spec.rockPx||PX.ROCK_PX,lab=new Int16Array(C*R).fill(-1),M=[],hOf=q=>RH&&RH[q]||3,desert=clim==='desert';
      for(let q0=0;q0<C*R;q0++){if(kind[q0]!==6||lab[q0]>=0)continue;const id=M.length,m={c0:C,c1:-1,r0:R,r1:-1,n:0,zmax:0},st=[q0];lab[q0]=id;
        while(st.length){const q=st.pop(),i=q%C,j=(q-i)/C;m.n++;if(i<m.c0)m.c0=i;if(i>m.c1)m.c1=i;if(j<m.r0)m.r0=j;if(j>m.r1)m.r1=j;
          for(const [a,c] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+c,n=y*C+x;if(x>=0&&y>=0&&x<C&&y<R&&kind[n]===6&&lab[n]<0){lab[n]=id;st.push(n)}}}M.push(m)}
      for(const m of M)m.b=[Math.max(0,m.c0*cs-6),Math.max(0,m.r0*cs-6),Math.min(W,(m.c1+1)*cs+6),Math.min(H,(m.r1+1)*cs+6)];
      // (a rect's rock window (RX0-RY1: ZR and MR over it): the window, the march of a shadow to its upper left (the field's highest
      //  peak, zm, makes it K px), the rock below it that rises into it (zm px); its masses those near it, each reckoned whole)
      const SK=1.6,zm0=full?0:PL.zm,K0=Math.ceil(zm0/SK)+1,RX0=full?0:Math.max(0,WX0-K0-2),RY0=full?0:Math.max(0,WY0-Math.ceil(K0*.38)-4),RX1=full?W:Math.min(W,WX1+6),RY1=full?H:Math.min(H,WY1+Math.ceil(zm0)+6),RWd=RX1-RX0;
      const use=M.map(m=>full||m.b[0]<RX1+K0+8&&m.b[2]>RX0-K0-8&&m.b[1]<RY1+K0+8&&m.b[3]>RY0-K0-8),WRk=full?null:[RX0,RY0,RX1,RY1];
      if(WRk)M.forEach((m,id)=>{if(use[id]){WRk[0]=Math.min(WRk[0],m.b[0]);WRk[1]=Math.min(WRk[1],m.b[1]);WRk[2]=Math.max(WRk[2],m.b[2]);WRk[3]=Math.max(WRk[3],m.b[3])}});
      const ZR=new Float32Array(RWd*(RY1-RY0)),MR=new Uint16Array(RWd*(RY1-RY0)),RS=new Uint16Array(SW*SH),GY=new Int16Array(SW*SH),NR1=noise(W,H,15,seed+80,WRk),NR2=noise(W,H,7,seed+81,WRk),NT=noise(W,H,5,seed+82,WRk);
      const inR=(x,y)=>x>=RX0&&y>=RY0&&x<RX1&&y<RY1,RI=(x,y)=>(y-RY0)*RWd+x-RX0,ZRat=(x,y)=>inR(x,y)?ZR[RI(x,y)]:0,MRat=(x,y)=>inR(x,y)?MR[RI(x,y)]:0;
      let rx0=W,rx1=0,ry0=H,ry1=0,zm=0;
      // (1) each mass's footprint (its cells, and their heights, on a small grid a cell bigger each side, read through the wobble), its
      //     distance in from the edge (chamfer 3-4) and its height
      M.forEach((m,id)=>{if(!use[id])return;const [x0,y0,x1,y1]=m.b,bw=x1-x0,bh=y1-y0;
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
          z=Math.max(.6,z);if(inR(x,y)){const p=RI(x,y);if(z>ZR[p]){ZR[p]=z;MR[p]=id+1}}if(z>m.zmax)m.zmax=z}
        if(x0<rx0)rx0=x0;if(x1>rx1)rx1=x1;if(y0<ry0)ry0=y0;if(y1>ry1)ry1=y1;if(m.zmax>zm)zm=m.zmax});
      if(!full)zm=zm0;
      // (each column's rows holding rock: its masses' boxes)
      const CY0=new Int16Array(W).fill(H),CY1=new Int16Array(W);M.forEach((m,id)=>{if(use[id])for(let x=m.b[0];x<m.b[2];x++){if(m.b[1]<CY0[x])CY0[x]=m.b[1];if(m.b[3]>CY1[x])CY1[x]=m.b[3]}});
      const LSX=-.92,LSY=-.38,K=Math.ceil(zm/SK)+1,LX=-.6,LY=0,LZ=.8,LN_=Math.hypot(LX,LY,LZ);
      // (in the rock's shadow: a march toward the light over ZR, st px a step; bx, by: the rock's box's west and north edges)
      const shadowed=(x,y,z0,st=1,bx=0,by=0)=>{for(let k=2;k<=K;k+=st){const qx=Math.round(x+LSX*k),qy=Math.round(y+LSY*k);if(qx<bx||qy<by||qx>=W||qy>=H)return false;if(ZRat(qx,qy)>z0+k*SK)return true}return false};
      // (the small map: the ground's colour, by cell, where the rock will stand over it: the whole only)
      const cy0=Math.max(0,Math.floor((ry0-zm)/cs)),cy1=Math.min(R-1,Math.floor(ry1/cs)),cx0=Math.floor(rx0/cs),cx1=Math.min(C-1,Math.floor((rx1-1)/cs)),UND=full?new Float32Array(C*R*3).fill(-1):null;
      if(full)for(let j=cy0;j<=cy1;j++)for(let i=cx0;i<=cx1;i++){let s0=0,s1=0,s2=0,n=0;for(let y=j*cs+1;y<Math.min(H,(j+1)*cs);y+=2)for(let x=i*cs+1;x<Math.min(W,(i+1)*cs);x+=2){const o=(y*W+x)*4;s0+=D[o];s1+=D[o+1];s2+=D[o+2];n++}if(n){UND[(j*C+i)*3]=s0/n;UND[(j*C+i)*3+1]=s1/n;UND[(j*C+i)*3+2]=s2/n}}
      yield at(5,.3);
      // (2) on the ground: scree round each foot (stones, tufts, drifts), its contact shade, the masses' shadows to the lower right
      //     (tested on a 2-px lattice)
      const GT=P.rock.g?P.rock.g.map(hx):TU,DN=new Uint8Array(SW*SH),NB=[[0,-2],[2,0],[-2,0],[0,2],[0,-4],[3,-2],[-3,-2],[4,0],[-4,0]];
      for(const [id,m] of M.entries()){if(!use[id])continue;const Km=Math.ceil(m.zmax/SK)+1,X0=Math.max(WX0,m.b[0]-4),X1=Math.min(WX1,m.b[2]+Km+2),Y0=Math.max(16,WY0,m.b[1]-4),Y1=Math.min(WY1,m.b[3]+Math.ceil(Km*.45)+2);
        for(let y=Y0;y<Y1;y++)for(let x=X0;x<X1;x++){const p=IX(x,y);if(MRat(x,y)||DN[p])continue;DN[p]=1;const o=p*4;
          if(x<m.b[2]+4&&y<m.b[3]+4){let near=0;for(const [a,c] of NB){const u=x+a,v=y+c;if(u>=0&&v>=0&&u<W&&v<H&&MRat(u,v)){near=Math.abs(a)+Math.abs(c);break}}
            if(near){const h=PX.hash(x,y,seed+84);mix(o,LO,near<=2?.22:.1);if(h<.16)put(o,RC[h<.05?1:h<.11?2:3]);else if(h<.22&&near>2)put(o,RC[4]);else if(SNW&&h>.6)put(o,SNW[1]);else if(h>.8&&!desert)mix(o,GT[1],.5)}}
          if(shadowed(x&~1,y&~1,0,2,m.b[0],m.b[1]))mix(o,LO,.42)}}
      yield at(5,.5);
      // (3) the rock, front to back a column at a time
      const SN=SNW||null,MS=P.rock.m?P.rock.m.map(hx):null,lich=hx('#b4b48c');
      // (a rect's: its columns, from the rock low enough to rise into it (a screen row is painted by the first ground row up its column
      //  that reaches it, as in the whole), its rows alone painted)
      const xa=Math.max(rx0,WX0),xb=Math.min(rx1,WX1);
      for(let x=xa;x<xb;x++){let hz=1e9,prev=false;if(x>rx0&&!((x-rx0)%64))yield at(5,.5+.4*(x-rx0)/(rx1-rx0));
        for(let y=(full?CY1[x]:Math.min(CY1[x],WY1+Math.ceil(zm)+2))-1;y>=Math.max(CY0[x],WY0);y--){const id=MRat(x,y);if(!id){prev=false;continue}if(!prev)hz=Math.min(hz,y+1);prev=true;
          const z=ZRat(x,y),sy=Math.round(y-z);if(sy>=hz)continue;const m=M[id-1];
          const gx=((x<W-1?ZRat(x+1,y):0)-(x?ZRat(x-1,y):0))/2,gy=((y<H-1?ZRat(x,y+1):0)-(y?ZRat(x,y-1):0))/2,nl=Math.hypot(gx,gy,1),nz=1/nl,lam=(-gx*LX-gy*LY+LZ)/nl/LN_;
          const v0=.5+.45*lam-(shadowed(x,y,z)?.22:0);
          for(let r=Math.max(0,sy,WY0);r<hz&&r<WY1;r++){const q=IX(x,r),o=q*4,hg=y-r;
            let v=v0-.16*Math.max(0,1-hg/10)+(NT(x,r)-.5)*.1+(PX.hash(x,r,seed+85)-.5)*.07;
            let k=v>.82?0:v>.66?1:v>.48?2:v>.32?3:4;if(nz<.5&&PX.hash(x,(r+(x&3))>>2,seed+86)<.07)k=Math.min(4,k+1);if(RB&&nz>.8)k=Math.max(1,k);
            put(o,RC[k]);
            if(RB){if(nz<.8||r>sy){const u=(hg+NT(x,7)*4)/3.5,bd=Math.floor(u)&3;if(bd===1)mix(o,RB[0],.32);else if(bd===3)mix(o,RB[1],.3);if(u%1<.29&&nz<.6)mix(o,RB[2],.4)}else if(PX.hash(x,r,seed+88)<.06)mix(o,RB[2],.3)}
            else if(SN){if(nz>.5&&hg>m.zmax*.46+(NT(x,r)-.5)*10||nz>.82&&hg>8)put(o,SN[v>.66?0:v>.42?1:2])}
            else if(MS){if(nz>.55&&NT(x+70,y)>.5||hg<3&&PX.hash(x,r,seed+87)<.35)put(o,MS[k<2?0:k<4?1:2])}
            else{if(nz>.72&&hg<m.zmax*.6&&NT(x+40,y)>.6)put(o,GT[k<2?0:k<4?1:2]);else if(PX.hash(x,r,seed+87)<.005)put(o,lich)}
            F[q]=3;RS[q]=id;GY[q]=y}
          hz=sy}}
      yield at(5,.9);
      // (4) the outline: round its silhouette, and along a crest over the rock behind it (the ground behind a step of 6+ px)
      const OUT=lerp(RC[4],[12,14,22],.35),CR=RC[4],s=(u,v)=>inW(u,v)?RS[IX(u,v)]:0;
      for(let x=xa;x<xb;x++)for(let y=Math.max(WY0,CY0[x]-Math.ceil(zm)-1);y<Math.min(WY1,CY1[x]);y++){const q=IX(x,y),id=RS[q];if(!id)continue;
        if(s(x,y-1)!==id||s(x-1,y)!==id||s(x+1,y)!==id||s(x,y+1)!==id)put(q*4,OUT);
        else if((inW(x,y+1)?GY[q+SW]:undefined)-GY[q]>5)put(q*4,CR)}
      if(full){cv.under=UND;PLn.zm=zm}return RS}
    /* (2b) roads and paths (spec.ways: [{kind: 'road'|'path'|'chain', p: [[x,y]...]}], terrain.js denseLay and wayPlan; a chain of
       clearings is no track), their lines first (painted in 3b): DR each pixel's distance to its way ×8 (255: none), so the
       details, lone trees and reeds keep off it and a tree's crown off its line (a gap in the canopy); DS how far along it lies (px,
       mod 256); DK its kind (1 road, 2 path), 4 wet (marsh round it: a causeway or a boardwalk), 16 its side of the line, 8 a climb (the terrace level under
       its line changes within 20 px: up a rise or a ramp the way runs on, a little stronger than on other slopes) */
    const WY=(spec.ways||spec.recipe&&spec.recipe.ways||[]).filter(w=>(w.kind==='road'||w.kind==='path')&&w.p&&w.p.length>1),DR=WY.length?new Uint8Array(SW*SH).fill(255):null,HW=[0,10,4];
    const onWay=(x,y)=>!!DR&&x>=WX0&&y>=WY0&&x<WX1&&y<WY1&&DR[((y|0)-WY0)*SW+(x|0)-WX0]<255,DS=DR&&new Uint8Array(SW*SH),DK=DR&&new Uint8Array(SW*SH);let wx0=W,wy0=H,wx1=-1,wy1=-1;
    if(DR){
      // (each way's line smoothed (Catmull-Rom, 4 steps a gap); a pixel within its half-width and verge takes the nearest way's
      // distance, how far along it lies and its kind)
      const hasM=kind.includes(2);for(const [wi,w] of WY.entries()){const k=w.kind==='road'?1:2,e=HW[k]+5,Q=w.p,pts=[];
        for(let j=0;j<Q.length-1;j++){const p0=Q[Math.max(0,j-1)],p1=Q[j],p2=Q[j+1],p3=Q[Math.min(Q.length-1,j+2)];
          for(let q=0;q<4;q++){const t=q/4,t2=t*t,t3=t2*t,cr=(a,b,c,d)=>.5*(2*b+(c-a)*t+(2*a-5*b+4*c-d)*t2+(3*b-a-3*c+d)*t3);pts.push([cr(p0[0],p1[0],p2[0],p3[0]),cr(p0[1],p1[1],p2[1],p3[1])])}}
        pts.push(Q[Q.length-1]);let s0=0;
        // (its wet stretches: a sample with marsh round it (a road: 7 of the 7×7 cells about it, its verges cleared; a path: 6 of 5×5); gaps of 3 samples or less closed, a run of
        // fewer than 4 dropped, so a causeway or a boardwalk runs whole and ends square)
        const wet=new Uint8Array(pts.length),wr=k===1?3:2,wn=k===1?7:6;if(hasM){pts.forEach((p,j)=>{const i0=Math.floor(p[0]/cs),j0=Math.floor(p[1]/cs);let n=0;for(let b=-wr;b<=wr;b++)for(let a=-wr;a<=wr;a++)if(cell(kind,i0+a,j0+b)===2)n++;wet[j]=n>=wn?1:0});
          for(let j=0,last=-9;j<pts.length;j++)if(wet[j]){if(j-last>1&&j-last<=4&&last>=0)wet.fill(1,last,j);last=j}
          for(let j=0;j<pts.length;){if(!wet[j]){j++;continue}let k2=j;while(k2<pts.length&&wet[k2])k2++;if(k2-j<4)wet.fill(0,j,k2);j=k2}}
        // (its climbs: the terrace level under a sample unlike another's within 5 samples (some 20 px) either way: the whole's, kept)
        let clb;if(full){const lv=pts.map(p=>Tat(Math.round(p[0]),Math.round(p[1])));clb=new Uint8Array(pts.length);for(let j=0;j<pts.length;j++)for(let q=Math.max(0,j-5);q<=Math.min(pts.length-1,j+5);q++)if(lv[q]!==lv[j]){clb[j]=8;break}PLn.clb.push(clb)}else clb=PL.clb[wi];
        for(let j=0;j<pts.length-1;j++){if(!(j&31))yield at(3);const ax=pts[j][0],ay=pts[j][1],dx=pts[j+1][0]-ax,dy=pts[j+1][1]-ay,L2=dx*dx+dy*dy,L=Math.sqrt(L2);
          const x0=Math.max(WX0,Math.floor(Math.min(ax,ax+dx)-e)),x1=Math.min(WX1-1,Math.ceil(Math.max(ax,ax+dx)+e)),y0=Math.max(WY0,Math.floor(Math.min(ay,ay+dy)-e)),y1=Math.min(WY1-1,Math.ceil(Math.max(ay,ay+dy)+e));
          if(x0>x1||y0>y1){s0+=L;continue}if(x0<wx0)wx0=x0;if(y0<wy0)wy0=y0;if(x1>wx1)wx1=x1;if(y1>wy1)wy1=y1;
          for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const px=x+.5-ax,py=y+.5-ay;let t=L2?(px*dx+py*dy)/L2:0;t=t<0?0:t>1?1:t;const d=Math.hypot(px-dx*t,py-dy*t);if(d>e)continue;
            const o=IX(x,y),q=Math.round(d*8),jj=t<.5?j:j+1;if(q<DR[o]){DR[o]=q;DS[o]=Math.floor(s0+t*L)&255;DK[o]=k|(wet[jj]?4:0)|clb[jj]|(px*dy-py*dx>0?16:0)}}
          s0+=L}}}
    /* a climbable edge (no wall: every edge of a field with no cliffs) is a smooth rise, not a face (the owner, 2026-10-18): the
       ground's own grass, snow, sand or mud shaded in soft steps from the top down to the foot (SLB px a level of the step: south,
       east, west, north; the south one faces us), lit from the upper left, its tint easing to the lower level's, a soft shadow
       below. Varied along each hill by seed and climate (SLV: grassy, earthy, stony): bare earth through the grass, now and then a
       low turf lip; stones and small outcrops poking through (frost: dark rock through the snow, its cap white; desert: low
       sandstone ledges, broken; swamp: mud, moss and roots). Never a continuous wall, never a prop: F 4 (nothing stands there).
       slopeAt: the edge a plateau pixel slopes to {f (1 at the foot), q (0 S, 1 E, 2 W, 3 N), st (the levels down), n (its band, px),
       sk (spec.steep's bits there)}, or null.
       A steep hill (World Phase 2, D41: spec.steep, terrain.js): its band SLS times as long, and a steep bank (bit 2) its own look,
       a darker stony bank: shaded deeper, the climate's rock showing through, broken ledges across its south face, outcrops and
       stones; scree (bit 4) loose grey stone, light and dark chips; its gentler shoulder (bit 1 alone) a rise as any */
    const STP=spec.steep&&spec.steep.length===C*R?spec.steep:null,SLS=2,stAt=(x,y)=>STP?cell(STP,Math.floor(x/cs),Math.floor(y/cs)):0;
    const SLB=[10,6,4,4],SLD=[[0,1,2],[1,0,1],[-1,0,4],[0,-1,8]],SLF=[.2,.14,.09,.05,.02],SLV={grass:[.48,.7],frost:[.42,.68],desert:[.48,.62],swamp:[.4,.78]}[clim],
      VN=noise(W,H,56,seed+71,WR),VN2=noise(W,H,20,seed+72,WR),ERT=clim==='frost'?RC[3]:clim==='swamp'?MU:FC[1],SWR=clim==='swamp';
    const slopeAt=(x,y,t)=>{let b=null;const sk=stAt(x,y),sb=sk&1?SLS:1;for(let q=0;q<4;q++){const [a,c,bt]=SLD[q];for(let d=1;d<=SLB[q]*t*sb;d++){const u=Tat(x+a*d,y+c*d);if(u>=t)continue;
      const st=t-u,n=SLB[q]*st*sb;if(d<=n&&(!WL||edgeK(bt,x+a*d,y+c*d)===0)){const f=n>1?1-(d-1)/(n-1):1;if(!b||f>b.f)b={f,q,st,n,sk}}break}}return b};
    const slopePx=(o,x,y,i,t,sv)=>{const f=sv.f,q=sv.q,n=sv.n,h=PX.hash(x,y,seed+73),fs=Math.min(1,Math.floor(f*4+h*.9)/4),rows=Math.round((1-f)*(n-1));F[i]=4;
      if(q===0)mix(o,LO,.05+.23*fs);else if(q===1)mix(o,LO,.06+.24*fs);else mix(o,HI,(q===2?.12:.09)-.05*fs);// (shade by the way it faces)
      if(sv.sk&2){mix(o,RC[3],.3+.25*NP(x,y));mix(o,LO,(q<2?.2:.1)+.18*fs);// (a steep bank: its dark rock through the cover, deeper shade)
        if(sv.sk&4){const k=PX.hash(x,y,seed+79);if(k<.24)put(o,RC[k<.07?0:k<.16?1:3]);else if(k>.93)mix(o,RC[1],.45);if(SNW&&k>.88&&q===0)put(o,SNW[1]);return}// (scree: loose chips)
        if(q===0&&f>.12&&rows%4===2&&PX.hash(x>>2,rows,seed+78)<.6){put(o,RC[4]);return}// (a broken ledge across it)
        if(q===0&&f>.12&&rows%4===1&&PX.hash(x>>2,rows+1,seed+78)<.6){put(o,RC[2]);return}// (its lit lip)
        const cx=Math.floor(x/5),cy=Math.floor(y/5),hb=PX.hash(cx,cy,seed+81);
        if(hb<.26){const dx=x-cx*5-2,dy=y-cy*5-2+(hb*50%1-.5),r=dx*dx+dy*dy,rr=2.5+hb*20;// (an outcrop: a lit stone, its shade below)
          if(r<rr){put(o,RC[dx+dy<-1.4?1:dx+dy>1.4?4:dy>0?3:2]);if(SNW&&dy<-1)put(o,SNW[0]);return}if(dy>0&&r<rr+4)mix(o,LO,.35)}
        if(h<.08)put(o,RC[h<.04?3:4]);return}
      const v=.5+(VN(x,y)*.75+VN2(x,y)*.25-.5)*2,kd=v<SLV[0]?0:v<SLV[1]?1:2;
      if(kd===1&&f>.1){const e=NP(x,y);if(e>.5)mix(o,ERT,Math.min(.6,(e-.5)*3.5));if(RMOSS&&e<.3)mix(o,RMOSS,.3);// (earthy: bare earth through the grass)
        if(q===0&&rows===1&&PX.hash(x>>3,y>>4,seed+75)<.6)mix(o,FC[3],.4);// (a low turf lip over it)
        if(SWR&&q===0&&rows>=1&&rows<=4&&PX.hash(x,y>>3,seed+76)<.07)mix(o,TRK1,.55);return}// (roots)
      if(kd===2&&f>.08){// (stony: stones, small outcrops; the desert's low ledges)
        if(clim==='desert'&&q===0&&NQ(x,y)>.45){const r=(rows+((x>>4)&1))%4;if(r===2){mix(o,RC[1],.55);return}if(r===3){mix(o,RC[3],.3);return}}
        const cx=Math.floor(x/6),cy=Math.floor(y/6),hb=PX.hash(cx,cy,seed+77);
        if(hb<.17){const dx=x-cx*6-2.5,dy=y-cy*6-2.5+(hb*50%1-.5),r=dx*dx+dy*dy,rr=3+hb*40;// (an outcrop: a small lit boulder, its shade below)
          if(r<rr){put(o,RC[dx+dy<-1.6?0:dx+dy>1.6?3:dy>0?2:1]);if(SNW&&dy<-1.2)put(o,SNW[0]);return}if(dy>0&&r<rr+5)mix(o,LO,.3)}
        if(h<.06)put(o,RC[h<.03?1:2]);return}
      if(h>.975)put(o,TU[1])};
    // a pixel below or beside a climbable rise: a soft shadow at its foot, a little east of it, a faint hint above its north side
    const slopeLow=(o,x,y,t)=>{
      for(let d=1;d<=5;d++){const u=Tat(x,y-d);if(u>t){if(!WL||edgeK(2,x,y-d+1)===0)mix(o,LO,SLF[d-1]*(u-t>1?1.4:1));return}}
      for(let d=1;d<=3;d++)if(Tat(x-d,y)>t){if(!WL||edgeK(1,x-d+1,y)===0)mix(o,LO,.09-.025*d);return}
      for(let d=1;d<=2;d++)if(Tat(x,y+d)>t){if(!WL||edgeK(8,x,y+d-1)===0)mix(o,LN,d===1?.1:.05);return}};
    // (3) colour, pixel by pixel
    yield* band(3,(x,y,i)=>{const o=i*4,t=T[i];
      if(hasW){const w=WV[i];if(w){water(o,x,y,i,w);return}const dl=DL[i]/3;if(dl<=3.2&&bank(o,x,y,dl))return;
        if(oasis){const q=(12-dl)/12+(NP(x,y)-.5)*.5;if(q>.3)mix(o,GR[q>.6?1:0],q>.55?.7:.4)}else if(dl<8)mix(o,LO,(8-dl)*.025)}// (the desert's green fringe; elsewhere the ground cools toward the water)
      const sv=t?slopeAt(x,y,t):null;if(t)mix(o,HI,P.lift*(sv?t-sv.st*sv.f*.85:t));// (a terrace: lighter and warmer a level; down a rise toward the level below)
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
      // a raised plateau seen from the south: with walls its cliffs and ramps (wlTop, wlLow); every climbable edge a smooth rise
      if(WL){if(t){let d1=0,st=0;for(let d=1;d<=2*FHS+2;d++){const u=Tat(x,y+d);if(u<t){d1=d;st=t-u;break}}if(wlTop(o,x,y,i,t,d1,st))return;if(sv){slopePx(o,x,y,i,t,sv);return}}wlLow(o,x,y,t,i);return}
      if(sv){slopePx(o,x,y,i,t,sv);return}slopeLow(o,x,y,t)});
    /* (3b) roads and paths painted (their lines: 2b), natural and low in contrast: a road a worn cart track 20 px wide (its width
       wandering a little), two faint wheel ruts wandering and fading in and out, a patchy grassy crown between, its edge soft and
       ragged, bare patches, the odd stone or puddle; a path a trodden strip 8 px wide a little lighter than the ground; by climate
       (WAYPAL: earth, packed snow, sand, mud). Where marsh lies round it a road runs on a causeway (raised earth, logs along its
       sides, its south face and shadow) and a path on a boardwalk (planks across, a beam each side, posts). Under everything that
       stands; never on water or a sheer face (a way climbs only where a terrace has a slope, a ramp or the cut made for it); fainter
       on a slope, less so where it climbs */
    if(DR)yield* (function* paintWays(){const BRW=bandRows(wx1-wx0+1,!full),WP=WAYPAL[clim]||WAYPAL.grass,NWD=noise(W,H,96,seed+93,WR);
      const TC=WP.c.map(hx),RU=hx(WP.rut),CRW=hx(WP.crown),WET=WP.wet&&hx(WP.wet),BNK=WP.bank&&hx(WP.bank),STN=hx(WP.stone),TU=P.tuft.map(hx),WD=RP.wood.map(hx),GAP=lerp(WA[2],[12,18,16],.5);
      // (a road's top, low in contrast so it lies in the land: worn earth fading in over its soft, ragged edge, lighter bare patches;
      // two wheel ruts, each wandering on its own side (NR) and fading in and out (NF), so they draw together and apart; a patchy
      // grassy crown between; the odd stone, and a puddle (ice in the frost) in a rut now and then; e its ragged edge, sd its side)
      const NR=[noise(W,H,36,seed+94,WR),noise(W,H,36,seed+95,WR)],NF=noise(W,H,48,seed+96,WR),NB=noise(W,H,22,seed+97,WR);
      const track=(i,x,y,d,e,s,h,sl,sd)=>{const pt=NP(x,y),ed=Math.min(1,Math.max(0,(e-d)/3.5));mix(i,lerp(TC[0],TC[2],Math.min(1,Math.max(0,(pt-.25)*2))),(.3+.45*ed)*sl);if(NB(x,y)>.62&&ed>.3)mix(i,TC[0],.25*sl);
        if(ed<.35){if(BNK)mix(i,BNK,.35*(1-ed));else if(h<.1)put(i,TU[1]);return}
        const ro=4.6+(NR[sd](x,y)-.5)*3.2,rd=Math.abs(d-ro),rs=Math.min(1,Math.max(0,(NF(x,y)-.28)*3));
        if(rd<1.1&&rs>0){mix(i,RU,(rd<.55?.5:.26)*rs*sl);if(WET&&rs>.7&&rd<.8&&PX.hash(x>>2,s>>3,seed+91)<.035)mix(i,WET,.8);return}
        if(d<ro-1.6){if(NB(x+40,y+40)>.45)mix(i,CRW,.3*sl);if(h<.08)mix(i,TU[1],.4)}if(h>.993)put(i,STN)};
      for(let y=wy0;y<=wy1;y++){if(y>wy0&&!((y-wy0)%BRW))yield at(4,.5*(y-wy0)/(wy1-wy0+1));for(let x=wx0;x<=wx1;x++){const o=IX(x,y),q=DR[o];if(q===255||WV&&WV[o]||F[o]===1||F[o]===2)continue;
        const k=DK[o]&3,m=DK[o]&4,d=q/8,s=DS[o],h=PX.hash(x,y,seed+90),e=HW[k]+(NX(x,y)-.5)*3+(h-.5)*1.2+(NWD(x,y)-.5)*(k===1?4:1.5),i=o*4,sl=F[o]===4?(DK[o]&8?.85:.7):1,south=y>WY0&&DR[o-SW]<q;
        if(m&&k===1){// (a causeway: the road on a raised bank, logs along its sides (a log every 14 px), its south face and shadow)
          if(d<=e-2.5)track(i,x,y,d,e-2.5,s,h,sl,DK[o]>>4&1);else if(d<=e){put(i,s%14===0?TRK1:south?TRK1:TRK0);if(!south&&d<e-1.6&&s%14)mix(i,HI,.25);else if(h>.8)mix(i,TRK1,.4)}
          else if(d<=e+1.5){if(south){put(i,TC[2]);mix(i,LO,.2)}else if(d<=e+1)mix(i,LO,.35)}else if(south&&d<=e+4)mix(i,LO,.16)}
        else if(m&&k===2){// (a boardwalk: planks across (4 px a plank, a dark seam), a beam each side (lit on the north), a post every 16 px)
          const eb=HW[2]+.5;if(d<=eb-1){if(s%4===3){put(i,WD[2]);mix(i,GAP,.45)}else{put(i,WD[PX.hash(s>>2,1,seed+92)<.5?0:1]);if(h>.94)put(i,WD[2])}}
          else if(d<=eb){put(i,s%16<2?WD[3]:south?WD[2]:WD[1])}else if(south&&d<=eb+2)mix(i,LO,s%16<2?.5:.3)}
        else if(k===1){if(d>e+1.5)continue;if(d>e){if(h<.35)mix(i,TC[1],.2*sl);else if(BNK&&h<.7)mix(i,BNK,.4*sl);continue}track(i,x,y,d,e,s,h,sl,DK[o]>>4&1)}
        else{// (a path: a trodden strip a little lighter than the ground, no ruts, its edge soft and ragged, a tuft now and then)
          if(d>e+1){continue}if(d>e){if(h<.3)mix(i,TC[0],.15*sl);continue}const ed=Math.min(1,Math.max(0,(e-d)/2.5));mix(i,TC[NP(x,y)>.55?0:1],(.18+.32*ed)*sl);if(BNK&&ed<.5)mix(i,BNK,.25);
          if(h<.05)mix(i,TU[1],.4);else if(h>.995)put(i,STN)}}}})();
    // (3b, the desert) its sand: wind ripples over the dunes, and on the open sand in a patch here and there, fading in and out (never
    //      on a face or a rise, a way or an oasis); noise only, no stream
    if(clim==='desert'){const NA=noise(W,H,80,seed+101,WR),NW=noise(W,H,16,seed+102,WR),RD=hx('#ae8a4e'),RL=hx('#f8e6b0'),A4=new Float32Array((W>>2)+1),y0=base?16:0,BRY=bandRows(SW,!full),W2=new Float32Array((W>>1)+1),WY=new Int32Array((W>>1)+1).fill(-1),ys=Math.max(y0,WY0);
      for(let y=ys;y<WY1;y++){if(y>ys&&!(y%BRY))yield at(4,.5+.5*y/H);if(!(y&3)||y===ys)for(let x=WX0;x<WX1;x+=4)A4[x>>2]=NA(x,y);
        for(let x=WX0;x<WX1;x++){const i=IX(x,y),t=T[i],a=t?.5+.5*A4[x>>2]:(A4[x>>2]-.6)*2.5;if(a<=.04||F[i]||Q[i]>.2||DR&&DR[i]<255)continue;
          const h=x>>1;if(WY[h]!==y>>1){WY[h]=y>>1;W2[h]=NW(x&~1,y&~1)}// (the ripples' wander, on a 2-px lattice, as needed)
          const ph=(y+x*.4+W2[h]*12)/5.5,f=ph-Math.floor(ph),s=Math.min(1,a)*(t?1:.6);if(f<.18)mix(i*4,RD,.2*s);else if(f<.34)mix(i*4,RL,.18*s)}}}
    yield at(5);
    // (3c) mountains and spires (kind 6): see rockMasses
    const RS=kind.includes(6)?(yield* rockMasses()):null;
    // (the pixels in: the whole's; a rect's, its part of the window, and what is drawn over it in field px)
    const g=cv.getContext('2d'),Pg=PX.paint(g);if(full)g.putImageData(img,0,0);else{g.putImageData(img,WX0-X,WY0-Y,X-WX0,Y-WY0,w,h);g.save();g.translate(-X,-Y)}yield at(6);
    /* (4) what is drawn over the ground: the whole places it (below: every bush, reed, detail, stone, glint, bridge, tree's shadow
       and the desert's flats, seeded, as ever) into a list in the order it is drawn (L: 6 a record, its op, x, y and three more),
       then draws it; a rect draws the list's records that reach into it (EXT), so whatever straddles a tile's edge is drawn into
       each tile it touches. What an op reads of the ground (a bridge's water, a clay pan's) is the window's */
    const S=RP.stone,WD=RP.wood,shadeOn=(x,y,a)=>{const v=Wv(x,y);if(v&&v!==255)Pg.px('rgba(10,18,34,'+a.toFixed(2)+')',x,y)};
    const stone=(x,y,v)=>{const w=5+(v&1);Pg.rect('rgba(10,18,34,.4)',x+1,y+4,w-1,1);Pg.rect(S[3],x+1,y+3,w-2,1);Pg.px(S[3],x+w-1,y+2);Pg.rect(S[0],x+1,y,w-2,1);Pg.rect(S[1],x,y+1,w,2);Pg.px(S[0],x,y+1);Pg.px(S[0],x+1,y+1);Pg.px(S[2],x+w-1,y+1);Pg.rect(S[2],x+2,y+2,w-3,1);
      if(clim==='swamp'&&v%3===0)Pg.px('#6a7a3c',x+1,y);if(!ICE){Pg.px(RP.foam,x+(w>>1),y+4);if(v&2)Pg.px(RP.foam,x+w,y+3)}};
    const floe=(x,y,v)=>{const rx=2+v%3,ry=1+(v>>2)%2;
      for(let b=-ry;b<=ry;b++)for(let a=-rx;a<=rx;a++){const e=(a/(rx+.5))**2+(b/(ry+.5))**2;if(e>1)continue;Pg.px(b===ry||b===ry-1&&e>.55?RP.ice[3]:b<0||a<0?RP.ice[0]:RP.ice[1],x+a,y+b)}
      Pg.rect(RP.w[3],x-rx+1,y+ry+1,2*rx,1)};
    // a bridge across the flow (X0-X1 its length, Y0-Y1 its 32 px): its shadow on the water to the lower right, earth ramps onto
    // the banks; wood: piles foaming in the water, a side beam, planks across the way (each its own tone, ragged, worn), railings
    // on posts every 8 px; stone: arches over the water between foaming piers, a roadway of setts, parapets capped (snow in the
    // frost), pillars at its ends
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
    let L,BRs,PANs,DECs;
    const DRAW=[
      (x,y,d,v)=>DETAIL[d](Pg,x,y,v,P,g,clim),// 0 a small detail (PX.battleDetails' kinds)
      (x,y,v)=>DETAIL.tuft(Pg,x,y,v,{tuft:OASG}),// 1 an oasis's green tuft
      (x,y,c)=>Pg.px(c,x,y),// 2 a pixel (current, a fleck)
      (x,y,a,b,c)=>Pg.rect(c,x,y,a,b),// 3 a rect (a glint, weed, a lily pad)
      (x,y,v)=>floe(x,y,v),// 4 a floe on a cold river
      (x,y,v)=>stone(x,y,v),// 5 a stone in a ford, at the water's edge
      (x,y)=>DETAIL.icerock(Pg,x,y,0,P),// 6 an iced rock by a frozen river
      (x,y,b)=>{const B=BRs[b].box;(flowV?deckH:deckV)(B[0],B[2],B[1],B[3],BRs[b].stone)},// 7 a bridge
      // 8 a standing tree's ground: its shadow to the lower right and its roots (none under snow nor sand); the tree is a prop
      (x,y,sp)=>{g.drawImage(shadowSprite(sp==='palm'||sp==='dead'||sp==='bbirch'?14:22),x-5,y-5);if(clim==='frost'||sp==='palm')return;const h=PX.hash(x,y,seed+23);
        Pg.px(P.trunk[1],x-3,y);Pg.px(P.trunk[1],x+3,y);if(h>.4){Pg.px(P.trunk[1],x-4,y+1);Pg.px(P.trunk[0],x-3,y-1)}if(h<.7)Pg.px(P.trunk[1],x+4,y+1)},
      (x,y,v)=>{g.drawImage(shadowSprite(8),x-2,y-2);g.drawImage(treeSprite(clim,'oak',v,true),x-4,y-7)},// 9 a bush
      (x,y,v)=>reeds(Pg,x,y,v,P),// 10 reeds
      // 11 a clay pan: a wobbly ellipse of pale clay split into plates, off faces, rises and ways
      (x0,y0,i)=>{const [cx,cy,rw,rh,Sd]=PANs[i];for(let y=cy-rh-1;y<=cy+rh+1;y++)for(let x=cx-rw-1;x<=cx+rw+1;x++){const e=((x-cx)/rw)**2+((y-cy)/rh)**2;if(e>1-PX.hash(x,y,seed+104)*.18||Fat(x,y)||Tat(x,y)||onWay(x,y))continue;
        let d1=1e9,d2=1e9;for(const [sx,sy] of Sd){const d=Math.hypot(x-sx,(y-sy)*1.6);if(d<d1){d2=d1;d1=d}else if(d<d2)d2=d}Pg.px(d2-d1<1.1?'#b08c58':e>.8?'#dcc08a':PX.hash(x,y,seed+105)<.06?'#d4b880':'#e6d09e',x,y)}},
      (x,y,k)=>{Pg.px(k%3?'#b08c60':'#8a6a4a',x,y);if(k%2===0){Pg.px('#e8d0a0',x-1,y);Pg.px('#6e5238',x,y+1)}},// 12 a pebble
      // 13 the desert's life's ground: a cactus's own (its shadow and contact shade), else a soft shadow as wide as the kind's
      (x,y,i)=>{const d=DECs[i],Sp=PX.desertSprite(d.k,d.v);if(Sp.g)g.drawImage(Sp.g,d.x-Sp.gx,d.y-Sp.gy);else if(Sp.sh)g.drawImage(shadowSprite(Sp.sh),d.x-(Sp.sh>>1)+2,d.y-(Sp.sh>>2)-1)},
      (x,y)=>{Pg.px('#ffffff',x-1,y-1);Pg.px(RP.ice[3],x,y)}];// 14 a crack in a frozen ford
    // (how far each op draws round its x, y; a rect, a bridge and a clay pan their own)
    const EXT=[[-17,-17,17,17],[-5,-6,5,1],[0,0,0,0],null,[-6,-4,6,5],[-1,-1,8,6],[-3,-4,4,2],null,[-6,-6,18,8],[-5,-8,7,3],[-7,-12,10,2],null,[-1,0,0,1],[-33,-24,33,17],[-1,-1,0,0]];
    const reach=(op,x,y,a,b)=>op===3?[x,y,x+a-1,y+b-1]:op===7?BRs[a].reach:op===11?PANs[a].reach:[x+EXT[op][0],y+EXT[op][1],x+EXT[op][2],y+EXT[op][3]];
    function* drawList(r){for(let k=0;k<L.length;k+=6){if(k&&!(k%24576))yield at(8,.45);const op=L[k],x=L[k+1],y=L[k+2],a=L[k+3],b=L[k+4];
      if(r){const e=reach(op,x,y,a,b);if(e[2]<r[0]||e[0]>=r[2]||e[3]<r[1]||e[1]>=r[3])continue}DRAW[op](x,y,a,b,L[k+5])}}
    let TREES=null,DEC=null;
    if(full){L=[];
    // (4) what stands on the ground. A tree's crown never hides a cliff (its foot, middle and crown kept off the faces)
    const R2=PX.dice(PX.rng(seed*31+7)),things=[],edgeCell=(i,j)=>{for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(cell(kind,i+a,j+b)!==1)return true;return false};
    // a river's bridges: their decks' boxes first (nothing else stands on them or by their ends: KO). A deck spans its cells across
    // the flow and reaches 4 px onto each bank; stone in the frost and the hills (or by a terrace), else its climate's make; a world
    // river's bridge as the world has it (World Phase 2: spec.recipe.river.stone, terrain.js)
    const WST=spec.recipe&&spec.recipe.river&&spec.recipe.river.stone!=null?!!spec.recipe.river.stone:null;
    const R3=PX.dice(PX.rng(seed*53+11)),KO=[],keep=(x,y)=>KO.some(b=>x>=b[0]&&x<b[2]&&y>=b[1]&&y<b[3]);
    const comps=k=>{const seen=new Uint8Array(C*R),out=[];for(let q0=0;q0<C*R;q0++){if(kind[q0]!==k||seen[q0])continue;const st=[q0],b={c0:C,c1:-1,r0:R,r1:-1};seen[q0]=1;
      while(st.length){const q=st.pop(),i=q%C,j=(q-i)/C;if(i<b.c0)b.c0=i;if(i>b.c1)b.c1=i;if(j<b.r0)b.r0=j;if(j>b.r1)b.r1=j;
        for(const [a,c] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+c,n=y*C+x;if(x>=0&&y>=0&&x<C&&y<R&&!seen[n]&&kind[n]===k){seen[n]=1;st.push(n)}}}out.push(b)}return out};
    BRs=hasW?comps(5).map(b=>{let lo=1e9,hi=-1;const A0=(flowV?b.r0:b.c0)*cs,A1=((flowV?b.r1:b.c1)+1)*cs,s0=Math.max(0,(flowV?b.c0:b.r0)*cs-32),s1=Math.min(flowV?W:H,((flowV?b.c1:b.r1)+1)*cs+32);
      for(let a=A0;a<A1;a++)for(let q=s0;q<s1;q++){const v=flowV?Wv(q,a):Wv(a,q);if(v&&v!==255){if(q<lo)lo=q;if(q>hi)hi=q}}
      const t0=Math.min((flowV?b.c0:b.r0)*cs,lo)-4,t1=Math.max(((flowV?b.c1:b.r1)+1)*cs,hi+1)+4,box=flowV?[t0,A0,t1,A1]:[A0,t0,A1,t1];
      let stone=WST!=null?WST:RP.bridge==='stone'||/hill/.test(rk);for(let j=b.r0-2;j<=b.r1+2&&!stone&&WST==null;j++)for(let i=b.c0-2;i<=b.c1+2;i++)if(cell(lvl,i,j)){stone=true;break}
      KO.push([box[0]-8,box[1]-10,box[2]+8,box[3]+12]);return{box,stone,reach:[box[0]-12,box[1]-12,box[2]+12,box[3]+16]}}):[];
    const clear=(x,y)=>!Fat(x,y)&&!Fat(x,y-6)&&!Fat(x,y-12)&&!Fat(x-5,y-7)&&!Fat(x+5,y-7)&&!Wat(x,y)&&(!hasW||Dl(x,y)>9&&!keep(x,y)),SPN=noise(W,H,56,seed+20),DN=noise(W,H,40,seed+21);
    // (a standing tree, 32 px: its foot and crown kept off the cliffs (a crown never hides one), the pools and the river's banks)
    const clearT=(x,y)=>clear(x,y)&&!Fat(x-4,y)&&!Fat(x+4,y)&&!Fat(x,y-18)&&!Fat(x,y-26)&&!Fat(x-11,y-12)&&!Fat(x+11,y-12)&&!Fat(x-8,y-22)&&!Fat(x+8,y-22)&&!Fat(x-12,y-4)&&!Fat(x+12,y-4)&&(!hasW||Dl(x,y)>14&&!keep(x,y-12));
    const species=(x,y)=>{let r=SPN(x,y)*.7+PX.hash(x,y,seed+22)*.3,a=0;for(const [n,s] of P.species){a+=s;if(r<a)return n}return P.species[P.species.length-1][0]};
    // woods: thick on their edges (the patch reads), clearings and thickets inside, bushes in the gaps. The trees stand (TREES: the
    // game draws them sorted with the soldiers); their shadows, roots and the bushes are painted
    TREES=[];const crownWay=(x,y)=>!!DR&&(onWay(x,y-6)||onWay(x,y-14)||onWay(x,y-22)||onWay(x-9,y-14)||onWay(x+9,y-14));// (a way's line under its crown)
    if(!bare)for(let y=6,row=0;y<H+8;y+=12,row++)for(let x=(row&1)*7;x<W;x+=14){const tx=x+R2.int(-3,3),ty=y+R2.int(-3,3);
      if(Kat(tx,ty)!==1||Kat(tx-6,ty)!==1||Kat(tx+6,ty)!==1||Kat(tx,ty-10)!==1)continue;
      if(!clearT(tx,ty)){if(clear(tx,ty)&&R2.chance(.4))things.push({y:ty,k:'bush',x:tx,v:R2.int(0,2)});continue}const e=edgeCell(Math.floor(tx/cs),Math.floor(ty/cs));
      if(R2.chance(e?.85:.15+.5*DN(tx,ty))){const t={y:ty,x:tx,sp:species(tx,ty),v:R2.int(0,2)};if(!crownWay(tx,ty))TREES.push(t)}else if(R2.chance(.5))things.push({y:ty,k:'bush',x:tx,v:R2.int(0,2)})}
    // lone trees and copses in the open (nothing collides)
    if(!bare){const spot=()=>{for(let k=0;k<30;k++){const x=R2.int(40,W-40),y=R2.int(56,H-30);if(!Kat(x,y)&&!Kat(x,y-14)&&clearT(x,y)&&!onWay(x,y)&&!crownWay(x,y))return[x,y]}return null};
      for(let n=R2.int(3,6);n>0;n--){const s=spot();if(s)TREES.push({y:s[1],x:s[0],sp:species(s[0],s[1]),v:R2.int(0,2)})}
      for(let n=R2.int(1,2);n>0;n--){const s=spot();if(!s)continue;const sp=species(s[0],s[1]);for(let m=R2.int(3,5);m>0;m--){const x=s[0]+R2.int(-20,20),y=s[1]+R2.int(-10,10);if(!Kat(x,y)&&clearT(x,y)&&!onWay(x,y)&&!crownWay(x,y))TREES.push({y,x,sp,v:R2.int(0,2)})}}}
    // an oasis: palms round the pool, reeds at its edge
    if(oasis)for(let y=8,row=0;y<H;y+=11,row++)for(let x=(row&1)*8;x<W;x+=16){const tx=x+R2.int(-2,2),ty=y+R2.int(-2,2);if(tx<0||ty<0||tx>=W||ty>=H)continue;const q=Q[ty*W+tx];
      if(q>.4&&q<.8&&!Wat(tx,ty)&&clearT(tx,ty)&&R2.chance(.6))TREES.push({y:ty,x:tx,sp:'palm',v:R2.int(0,2)});else if(q>.8&&q<.88&&R2.chance(.5))things.push({y:ty,k:'reed',x:tx,v:R2.int(0,99)})}
    if(!oasis)for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(kind[j*C+i]!==2)continue;for(let n=0;n<3;n++){const tx=i*cs+R2.int(1,14),ty=j*cs+R2.int(2,15);
      if(Kat(tx,ty)!==2||Wat(tx,ty)||Wat(tx,ty+1)||Fat(tx,ty))continue;const shore=Wat(tx,ty+2)||Wat(tx+3,ty)||Wat(tx-3,ty)||Wat(tx,ty-3);if(shore||R2.chance(.5))things.push({y:ty,k:'reed',x:tx,v:R2.int(0,99)})}}
    yield at(6,.6);
    // the small details, first (flat on the ground): by climate, in the open and in woods; never on a cliff, a pool or an oasis
    for(let j=1;j<R;j++){if(!(j%BR0))yield at(6,.6+.4*j/R);for(let i=0;i<C;i++){const k=kind[j*C+i];if(k===2)continue;for(const [d,ch] of P.detail[k===1?1:0]){if(!R2.chance(ch))continue;const x=i*cs+R2.int(2,13),y=j*cs+R2.int(3,15);
      if(y<16||Fat(x,y)||Fat(x+3,y)||Fat(x-3,y)||Kat(x,y)!==k||onWay(x,y)||onWay(x,y-3)||oasis&&Q[y*W+x]>.25||hasW&&(Dl(x,y)<15||Dl(x-4,y)<15||Dl(x+4,y)<15||keep(x,y)))continue;L.push(0,x,y,d,R2.int(0,999),0)}}}
    yield at(7);
    // the river's flat details: current lines and glints on the deep (floes on a cold one, weed on a swamp's), stepping stones across
    // a ford (cracks in a frozen one), stones at the water's edge, reeds on its banks (palms by a desert's); then its bridges
    if(hasW){const sl=k=>SLP[Math.max(0,Math.min((flowV?R:C)-1,Math.floor(k/cs)))],okDeep=(x,y,m)=>Wv(x,y)===2&&DW[y*W+x]>=m*3&&!keep(x,y);
      // (a floe drawn only where it lies wholly on the deep)
      const floeOk=(x,y,v)=>{const rx=2+v%3,ry=1+(v>>2)%2;for(let b=-ry-1;b<=ry+1;b++)for(let a=-rx-1;a<=rx+1;a++)if(!okDeep(x+a,y+b,2))return false;return true};
      for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(kind[j*C+i]!==4)continue;
        for(let n=0;n<2;n++){const x=i*cs+R3.int(0,15),y=j*cs+R3.int(0,15);if(!okDeep(x,y,ICE?6:4))continue;
          if(ICE){if(R3.chance(.4)){const v=R3.int(0,99);if(floeOk(x,y,v))L.push(4,x,y,v,0,0)}continue}
          if(R3.chance(.6)){const nL=R3.int(3,7),k0=sl(flowV?y:x),pts=[];for(let k=0;k<nL;k++){const px=flowV?Math.round(x+k0*k):x+k,py=flowV?y+k:Math.round(y+k0*k);if(!okDeep(px,py,3))break;pts.push([px,py])}
            pts.forEach(([px,py],k)=>L.push(2,px,py,k===pts.length-1&&R3.chance(.35)?P.glint:clim==='swamp'?PX.mix(RP.w[1],RP.w[2],.4):RP.w[1],0,0))}
          else if(R3.chance(.5)){if(clim==='swamp'&&R3.chance(.5)){L.push(3,x,y,2,1,'#5e7a3e');L.push(2,x,y,'#7a9650',0,0)}else L.push(3,x,y,2,1,P.glint)}}}
      if(ICE)for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(kind[j*C+i]!==3||!R3.chance(.5))continue;let x=i*cs+R3.int(2,13),y=j*cs+R3.int(2,13);const sx=R3.chance(.5)?1:-1;
        for(let k=R3.int(5,10);k>0;k--){if(Wv(x,y)!==1||DW[y*W+x]<6||keep(x,y))break;L.push(14,x,y,0,0,0);if(R3.chance(.6))x+=sx;else y+=R3.chance(.5)?1:-1}}
      else for(const f of comps(3)){const lo=(flowV?f.r0:f.c0)*cs,hi=((flowV?f.r1:f.c1)+1)*cs,s0=(flowV?f.c0:f.r0)*cs-6,s1=((flowV?f.c1:f.r1)+1)*cs+6,n=Math.max(1,Math.round((hi-lo)/160));
        for(let r=0;r<n;r++){const a=lo+Math.round((r+.5)*(hi-lo)/n);for(let q=s0+R3.int(1,3);q<s1;q+=R3.int(6,8)){const x=flowV?q:a+R3.int(-1,1),y=flowV?a+R3.int(-1,1):q;
          if(Wv(x,y)===1&&Wv(x+5,y)===1&&Wv(x,y+4)===1&&Wv(x+5,y+4)===1&&!keep(x,y))L.push(5,x,y,R3.int(0,99),0,0)}}}
      for(let y=by0+R3.int(0,2);y<by1;y+=3)for(let x=bx0;x<bx1;x++){const dl=Dl(x,y);if(y<16||keep(x,y))continue;
        if(dl>=3&&dl<=5){if(R3.chance(RP.reeds)&&!onWay(x,y))things.push({y,k:'reed',x,v:R3.int(0,99)});continue}if(PX.hash(x,y,seed+64)>.34)continue;const tx=x,ty=y;
        if(!dl){if(DW[ty*W+tx]<=4&&R3.chance(.03))L.push(5,tx-2,ty-1,R3.int(0,99),0,0)}
        else if(oasis&&dl>=15&&dl<=36&&R3.chance(.012)&&clearT(tx,ty))TREES.push({y:ty,x:tx,sp:'palm',v:R3.int(0,2)});
        else if(ICE&&dl>=12&&dl<=27&&R3.chance(.012))L.push(6,tx,ty,0,0,0)}
      yield at(7,.2);
      for(let b=0;b<BRs.length;b++)L.push(7,0,0,b,0,0);
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
    yield at(7,.5);
    // a standing tree's ground (8), the bushes (9) and reeds (10) in their order down the field
    let nt=0;for(const t of TREES){if(!(++nt&2047))yield at(7,.6);L.push(8,t.x,t.y,t.sp,0,0)}
    things.sort((a,b)=>a.y-b.y||a.x-b.x);
    for(const t of things)L.push(t.k==='bush'?9:10,t.x,t.y,t.v,0,0);
    // glints on the open pools (still: the ground is painted once); lily pads on warm water
    for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(kind[j*C+i]!==2)continue;for(let n=0;n<2;n++){const tx=i*cs+R2.int(0,13),ty=j*cs+R2.int(0,15);
      if(Wat(tx,ty)!==2||Wat(tx+2,ty)!==2||Wat(tx,ty-1)!==2)continue;if(!P.ice&&R2.chance(.35)){L.push(3,tx,ty,2,1,'#5e7a3e');L.push(2,tx,ty,'#7a9650',0,0)}else L.push(3,tx,ty,P.ice?3:2,1,P.glint)}}
    /* (4b) the desert's life (decoration: nothing collides, slows or hides anyone). Flat: clay pans cracked by the sun, pebbles, dark
       flecks, tufts. Standing (DEC, handed back as props dk 4): cacti, prickly pear, dead and dry shrubs, a skull or ribcage now and
       then, small rocks, in spaced clusters of 2-5 and a few alone, by area; fewer on the dunes, in the deployment zones and the
       open lane; more rocks and dry shrubs on a rocky field (erg, spires) and by rock; an oasis's green fringe thick with tall grass
       and green shrubs. Its own stream (R5): nothing else changes */
    yield at(8);DEC=[];PANs=[];
    if(clim==='desert'){const R5=PX.dice(PX.rng(seed*89+29)),rc=spec.recipe&&typeof spec.recipe==='object'?spec.recipe:{},Zn=spec.zone,zo=Zn?Zn[1]:.3*W,ln=rc.lane,A=W*H,rocky=/erg|spires/.test(rc.layout||'');
      const rockN=(x,y)=>{const i=Math.floor(x/cs),j=Math.floor(y/cs);for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(cell(kind,i+a,j+b)===6)return true;return false};
      const wt=(x,y)=>(x<zo||x>W-zo?.35:1)*(ln&&y>ln.y0&&y<ln.y1?.45:1)*(Tat(x,y)?.45:1);
      const ok=(x,y,q=.3)=>x>=6&&y>=24&&x<W-6&&y<H-3&&!Fat(x,y)&&!Fat(x-5,y)&&!Fat(x+5,y)&&!Fat(x,y-10)&&!Fat(x,y+3)&&!Fat(x+7,y+2)&&!Fat(x-3,y+3)&&!Wat(x,y)&&!Wat(x,y+3)&&!onWay(x,y)&&!onWay(x,y-5)&&Q[y*W+x]<=q&&(!hasW||Dl(x,y)>12&&!keep(x,y));
      const near=(x,y,dx,dy)=>DEC.some(d=>Math.abs(d.x-x)<dx&&Math.abs(d.y-y)<dy)||TREES.some(t=>Math.abs(t.x-x)<7&&Math.abs(t.y-y)<5);
      const pickK=L=>{let r=R5.R()*L.reduce((a,b)=>a+b[1],0);for(const [k,w] of L){r-=w;if(r<0)return k}return L[0][0]};
      const KW=[['saguaro',3],['young',1.2],['barrel',2],['pear',2],['dead',1.4],['dry',2.2],['rocks',1.8],['bones',.3]],KR=[['saguaro',1.6],['young',.7],['barrel',1.3],['pear',1],['dead',2],['dry',3.4],['rocks',4.6],['bones',.35]];
      // (flat: clay pans, each a wobbly ellipse of pale clay split into plates (11); pebbles (12); flecks)
      for(let n=Math.max(2,Math.round(A/170000));n>0;n--)for(let tr=0;tr<8;tr++){const cx=R5.int(30,W-30),cy=R5.int(30,H-12),rw=R5.int(14,28),rh=R5.int(6,11),S=[];
        if(Tat(cx,cy)||!ok(cx,cy,.05)||!ok(cx-rw,cy,.05)||!ok(cx+rw,cy,.05))continue;for(let k=R5.int(5,8);k>0;k--)S.push([cx+R5.int(-rw,rw),cy+R5.int(-rh,rh)]);
        const pn=[cx,cy,rw,rh,S];pn.reach=[cx-rw-1,cy-rh-1,cx+rw+1,cy+rh+1];PANs.push(pn);L.push(11,cx,cy,PANs.length-1,0,0);break}
      for(let n=Math.round(A/7000*(rocky?1.6:1));n>0;n--){const x=R5.int(8,W-8),y=R5.int(24,H-4),m=R5.int(3,6);if(Tat(x,y)&&R5.chance(.6)||!ok(x,y,.2))continue;
        for(let k=0;k<m;k++){const px=x+R5.int(-6,6),py=y+R5.int(-3,3);if(Fat(px,py)||onWay(px,py))continue;L.push(12,px,py,k,0,0)}}
      for(let n=Math.round(A/3000);n>0;n--){const x=R5.int(4,W-4),y=R5.int(20,H-2);if(!Fat(x,y)&&!onWay(x,y)&&!Wat(x,y)&&Q[y*W+x]<.2)L.push(2,x,y,'#7e6046',0,0)}
      yield at(8,.1);
      // (standing: the clusters, spaced 64 px apart at least, each round a main kind; then a few alone)
      const CL=[];for(let c=Math.round(A/34000);c>0;c--)for(let tr=0;tr<10;tr++){const x=R5.int(12,W-12),y=R5.int(28,H-6);if(!ok(x,y)||!R5.chance(wt(x,y))||CL.some(p=>(p[0]-x)**2+(p[1]-y)**2<4096)||near(x,y,8,5))continue;
        CL.push([x,y]);const L2=rocky||rockN(x,y)?KR:KW,main=pickK(L2),m=R5.int(2,5);let bones=false;
        for(let k=0,t2=0;k<m&&t2<m*6;t2++){const px=k?x+R5.int(-22,22):x,py=k?y+R5.int(-11,11):y;if(k&&(!ok(px,py)||near(px,py,8,5)))continue;
          let kk=k&&R5.chance(.55)?pickK(L2):main;if(kk==='bones'){kk=bones?'rocks':R5.chance(.55)?'skull':'ribs';bones=true}DEC.push({x:px,y:py,k:kk,v:R5.int(0,5)});k++}
        for(let k=R5.int(1,3);k>0;k--){const tx=x+R5.int(-18,18),ty=y+R5.int(-8,8);L.push(0,tx,ty,'tuft',R5.int(0,999),0)}break}
      for(let c=Math.round(A/40000);c>0;c--){const x=R5.int(12,W-12),y=R5.int(28,H-6);if(ok(x,y)&&R5.chance(wt(x,y))&&!near(x,y,12,8))DEC.push({x,y,k:pickK(rocky||rockN(x,y)?[['rocks',5],['dry',3],['dead',1.4]]:[['rocks',3],['dry',2.5],['dead',1.2],['young',.6],['barrel',.5]]),v:R5.int(0,5)})}
      yield at(8,.2);
      // (an oasis's fringe, past its palms: tall grass and green shrubs, green tufts painted between (1); then round it out to twice its
      //  radius, thinning: grass and green shrubs near, sage, prickly pear and young cacti farther)
      if(kind.includes(2)){for(let y=10,row=0;y<H;y+=7,row++)for(let x=(row&1)*5;x<W;x+=10){const tx=x+R5.int(-2,2),ty=y+R5.int(-2,2),v=R5.int(0,999);if(tx<0||ty<0||tx>=W||ty>=H)continue;const q=Q[ty*W+tx];if(q<.1||q>.62)continue;
          if(q<.55&&R5.chance(.4)&&!Fat(tx,ty)&&!onWay(tx,ty)){const ux=tx+R5.int(-3,3),uy=ty+R5.int(-2,2);L.push(1,ux,uy,v,0,0)}
          if(R5.chance(q>.25?.5:.22)&&ok(tx,ty,.62)&&!near(tx,ty,7,4))DEC.push({x:tx,y:ty,k:R5.chance(.6)?'grass':q>.25||R5.chance(.5)?'green':'dry',v:v%6})}
        for(const o of rc.marsh||[])for(let y=Math.round(o.y-2*o.r),row=0;y<o.y+2*o.r;y+=6,row++)for(let x=Math.round(o.x-2*o.r)+(row&1)*5;x<o.x+2*o.r;x+=10){const tx=x+R5.int(-2,2),ty=y+R5.int(-2,2),d=Math.hypot(tx-o.x,(ty-o.y)*1.2)/o.r,v=R5.int(0,999);
          if(d<.9||d>2)continue;const f=1-(d-.9)/1.1;if(R5.chance(.3*f)&&ok(tx,ty,.25))L.push(1,tx,ty,v,0,0);
          if(R5.chance(.32*f)&&ok(tx,ty,.62)&&!near(tx,ty,8,5))DEC.push({x:tx,y:ty,k:d<1.3?(R5.chance(.55)?'grass':'green'):pickK([['green',2],['grass',1.5],['dry',1.5],['pear',1],['young',.7]]),v:v%6})}}
      yield at(8,.3);
      // (their ground (13), in their order down the field)
      DEC.sort((a,b)=>a.y-b.y||a.x-b.x);for(let i=0;i<DEC.length;i++)L.push(13,DEC[i].x,DEC[i].y,i,0,0)}
    DECs=DEC;Object.assign(PLn,{L,BR:BRs,pans:PANs,DEC})}
    else{L=PL.L;BRs=PL.BR;PANs=PL.pans;DECs=PL.DEC}
    yield* drawList(full?null:[X,Y,X+w,Y+h]);
    if(!full){g.restore();return cv}
    /* (5) what stands up out of the ground, for the game to draw sorted by depth with the soldiers (cv.props, sorted by y):
       trees {dk:1, x, y (the trunk's foot), s (its sprite), dx, dy (where s is drawn), box (its drawn pixels, field px)}, and the
       plateaus' south cliff faces {dk:2, x, y (its foot: the face's lowest row), s, dx, dy, box (as a tree's), sx, sy, w, h}: the
       faces' pixels cut into sections a column run each, up to 16 px wide, whose columns' foot rows lie within 2 px (its foot: the highest of them), each its own small
       picture (one big shared one is slow to draw from among many others); a soldier whose feet are higher on the screen than a
       section's foot is behind it (on the rim above the climb) */
    yield at(8,.5);const props=[];for(const t of TREES){const s=treeSprite32(clim,t.sp,t.v),b=s.box;props.push({dk:1,x:t.x,y:t.y,s,dx:t.x-16,dy:t.y-31,box:[t.x-16+b[0],t.y-31+b[1],t.x-16+b[2],t.y-31+b[3]]})}
    // (the mountains' too {dk:3, ...as a face's}: their pixels' column runs, each run one mass's, cut the same way)
    const cutF=F.includes(1);
    if(cutF||RS){const src=g.getImageData(0,0,W,H).data,fc=PX.canvas(W,H),fg=fc.getContext('2d'),fi=fg.createImageData(W,H),fd=fi.data;
      const BC=Math.max(1,Math.floor(PX.GROUND_BAND/H)),cut=function*(v,dk,ID){let open=[];for(let x=0;x<W;x++){if(x&&!(x%BC))yield at(8,.5+.2*x/W+(dk===3?.2:0));const runs=[];for(let y=0;y<H;y++){if(F[y*W+x]!==v)continue;const id=ID?ID[y*W+x]:0;let y1=y;while(y1+1<H&&F[(y1+1)*W+x]===v&&(!ID||ID[(y1+1)*W+x]===id))y1++;runs.push([y,y1,id]);
          for(let k=y;k<=y1;k++){const o=(k*W+x)*4;fd[o]=src[o];fd[o+1]=src[o+1];fd[o+2]=src[o+2];fd[o+3]=255}y=y1}
        const next=[];for(const [y0,y1,id] of runs){let s=open.find(q=>q.id===id&&Math.max(q.yb,y1)-Math.min(q.y,y1)<=2&&q.lt<=y1+1&&y0<=q.lb+1&&x-q.sx<16);
          if(s){open.splice(open.indexOf(s),1);s.w++;if(y0<s.sy){s.h+=s.sy-y0;s.sy=y0}if(y1>s.yb){s.h+=y1-s.yb;s.yb=y1}if(y1<s.y)s.y=y1}else{s={dk,x,y:y1,yb:y1,sx:x,sy:y0,w:1,h:y1-y0+1,id};props.push(s)}s.lt=y0;s.lb=y1;next.push(s)}
        open=next}};
      if(cutF)yield* cut(1,2);if(RS)yield* cut(3,3,RS);
      fg.putImageData(fi,0,0);for(const p of props)if(p.dk>=2){p.x=p.sx+(p.w>>1);p.box=[p.sx,p.sy,p.sx+p.w-1,p.sy+p.h-1];p.dx=p.sx;p.dy=p.sy;p.s=PX.canvas(p.w,p.h,q=>q.drawImage(fc,p.sx,p.sy,p.w,p.h,0,0,p.w,p.h));delete p.lt;delete p.lb;delete p.yb;delete p.id}}
    // (the desert's life {dk:4, ...as a tree's, dc: its kind}: decoration, faded over your men as a tree is; cv.decor how many)
    for(const d of DEC){const S=PX.desertSprite(d.k,d.v),b=S.box,dx=d.x-S.ax,dy=d.y-S.ay;props.push({dk:4,x:d.x,y:d.y,s:S.s,dx,dy,box:[dx+b[0],dy+b[1],dx+b[2],dy+b[3]],dc:d.k})}
    props.sort((a,b)=>a.y-b.y||a.x-b.x);cv.props=props;cv.trees=TREES.length;cv.decor=DEC.length;cv.plan=PLn;
    return cv}
  // the standing props of a ground (trees and cliff faces, PX.battleGround's cv.props) drawn in their order over it: the gallery's
  // preview (the game sorts them in with its soldiers: render.js). view: [x0,y0,x1,y1] field px, or all
  PX.battleProps=(g,ground,view)=>{const L=ground&&ground.props;if(!L)return;for(const p of L){const b=p.box;if(view&&(b[2]<view[0]||b[0]>view[2]||b[3]<view[1]||b[1]>view[3]))continue;
    g.drawImage(p.s,p.dx,p.dy)}};
  /* R16: a battle's ground by tiles (GROUND_TILE.size px), for the game to draw (render.js). PX.battleGroundSteps(spec) paints the
     whole (as PX.battleGround) and keeps it as a PX.BattleGround: its tiles in an LRU (cap at most; those in view never let go), the
     ones nearest the middle cut from the whole at once; on a field of more tiles than cap, a half-resolution overview (each 2×2
     averaged), drawn at a zoom of GROUND_TILE.over or less, or when the view would need more tiles than cap; the small map's picture
     (mini); and what the whole hands back (props, trees, decor, water, under, plan). A tile let go is painted again from the plan
     when next wanted (PX.battleGroundPaint: the same pixels). apron: a tile's window past its edges (the reach of the ground's
     slopes, cliffs, banks and ways); slice: ms a frame for painting tiles ahead (twice that while one in view is missing); sync:
     tiles in view painted at once, never shown from the overview (the tests) */
  PX.GROUND_TILE={size:512,cap:16,apron:48,over:.5,slice:4,sync:false};
  class BattleGround{
    // W, H: the field; paint(x, y, w, h, out): a generator painting that rect of the field into out (w×h), returning it; over():
    // the overview made at once, when first wanted (else from the tiles, one by one)
    constructor(W,H,paint,over){const S=PX.GROUND_TILE.size;Object.assign(this,{width:W,height:H,paint,mkOver:over,cols:Math.ceil(W/S),rows:Math.ceil(H/S),tiles:new Map(),jobs:new Map(),queue:[],pool:[],view:new Set(),over:null,last:null,painted:0})}
    get cap(){return PX.GROUND_TILE.cap}
    rect(k){const S=PX.GROUND_TILE.size,cx=k%this.cols,cy=(k-cx)/this.cols,x=cx*S,y=cy*S;return[x,y,Math.min(S,this.width-x),Math.min(S,this.height-y)]}
    // (a tile's painting, as steps: its own canvas, or one let go that fits)
    start(k){let j=this.jobs.get(k);if(j)return j;const [x,y,w,h]=this.rect(k),i=this.pool.findIndex(c=>c.width===w&&c.height===h),cv=i>=0?this.pool.splice(i,1)[0]:PX.canvas(w,h);
      j={k,cv,gen:this.paint(x,y,w,h,cv)};this.jobs.set(k,j);return j}
    // (a tile in, the freshest: the least recently used let go past cap, never one in view)
    put(k,cv){this.jobs.delete(k);this.tiles.delete(k);this.tiles.set(k,cv);for(const [q,c] of this.tiles){if(this.tiles.size<=this.cap)break;if(this.view.has(q)||q===k)continue;this.tiles.delete(q);this.drop(c)}}
    drop(cv){if(this.pool.length<2)this.pool.push(cv)}
    // a tile's canvas, painted now if it must be
    tile(k){const c=this.tiles.get(k);if(c){this.tiles.delete(k);this.tiles.set(k,c);return c}const j=this.start(k);let n;while(!(n=j.gen.next()).done);this.painted++;this.put(k,j.cv);return j.cv}
    // every tile in the field rect [x0,y0,x1,y1) painted now (a view about to be shown; the tests)
    ready(x0,y0,x1,y1){const S=PX.GROUND_TILE.size;for(let cy=Math.max(0,Math.floor(y0/S));cy<=Math.min(this.rows-1,Math.floor((y1-1)/S));cy++)for(let cx=Math.max(0,Math.floor(x0/S));cx<=Math.min(this.cols-1,Math.floor((x1-1)/S));cx++){this.view.add(cy*this.cols+cx);this.tile(cy*this.cols+cx)}}
    // the overview's part over the field rect [x0,y0,x1,y1), at the field's scale
    blitOver(g,x0,y0,x1,y1){const O=this.over,a=Math.floor(x0/2),b=Math.floor(y0/2),c=Math.min(O.width,Math.ceil(x1/2)),d=Math.min(O.height,Math.ceil(y1/2));if(c>a&&d>b)this.blit(g,O,a,b,c-a,d-b,a*2,b*2,(c-a)*2,(d-b)*2)}
    /* a piece drawn on g with its edges on whole pixels of g's canvas: zoomed by a fraction, two tiles side by side each left their
       edge pixel part covered, and the dark under them showed through as a hairline where they meet (a grid over the field) */
    blit(g,img,sx,sy,sw,sh,dx,dy,dw,dh){const m=g.getTransform();if(m.a===1&&m.d===1&&Number.isInteger(m.e)&&Number.isInteger(m.f)){g.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh);return}
      const L=Math.round(m.a*dx+m.e),T=Math.round(m.d*dy+m.f),R=Math.round(m.a*(dx+dw)+m.e),D=Math.round(m.d*(dy+dh)+m.f);if(R<=L||D<=T)return;
      g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(img,sx,sy,sw,sh,L,T,R-L,D-T);g.restore()}
    // (the overview made from the tiles, one by one: a ground whose whole was never painted at once (an arena's))
    overview(){const O=this.over=PX.canvas(Math.ceil(this.width/2),Math.ceil(this.height/2)),g=O.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='low';
      for(let k=0;k<this.cols*this.rows;k++){const [x,y,w,h]=this.rect(k);g.drawImage(this.tile(k),0,0,w,h,x/2,y/2,w/2,h/2)}}
    /* the field's view [x0,y0,x1,y1) (field px) drawn on g (in field px) at zoom z: zoomed out, the overview; else the tiles in it,
       the same pixels as the whole drawn there (each painted now if it must be; with an overview a missing one shown from it while it
       paints, a few ms a frame). Then the ring round the view queued, the way the view moves first, as many as cap leaves room for */
    drawView(g,x0,y0,x1,y1,z){const S=PX.GROUND_TILE.size,T=PX.GROUND_TILE,W=this.width,H=this.height;x0=Math.max(0,Math.floor(x0)-2);y0=Math.max(0,Math.floor(y0)-2);x1=Math.min(W,Math.ceil(x1)+2);y1=Math.min(H,Math.ceil(y1)+2);if(x1<=x0||y1<=y0)return;
      const c0=Math.floor(x0/S),r0=Math.floor(y0/S),c1=Math.floor((x1-1)/S),r1=Math.floor((y1-1)/S),far=z<=T.over||(c1-c0+1)*(r1-r0+1)>this.cap;
      if(far&&!this.over&&this.cols*this.rows>this.cap){if(this.mkOver)this.over=this.mkOver();else this.overview()}
      if(far&&this.over){this.blitOver(g,x0,y0,x1,y1);this.view=new Set();this.queue=[];for(const j of this.jobs.values())this.drop(j.cv);this.jobs.clear();return}
      this.view=new Set();for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++)this.view.add(cy*this.cols+cx);
      const miss=[];
      for(const k of this.view){const [X,Y,w,h]=this.rect(k),sx=Math.max(x0,X),sy=Math.max(y0,Y),sw=Math.min(x1,X+w)-sx,sh=Math.min(y1,Y+h)-sy;let cv=this.tiles.get(k);
        if(cv){this.tiles.delete(k);this.tiles.set(k,cv)}else if(this.over&&!T.sync){miss.push(k);this.blitOver(g,sx,sy,sx+sw,sy+sh);continue}else cv=this.tile(k);
        this.blit(g,cv,sx-X,sy-Y,sw,sh,sx,sy,sw,sh)}
      const dx=this.last?Math.sign(x0-this.last[0]):0,dy=this.last?Math.sign(y0-this.last[1]):0,mx=(c0+c1)/2,my=(r0+r1)/2,ring=[];this.last=[x0,y0];
      for(let cy=r0-1;cy<=r1+1;cy++)for(let cx=c0-1;cx<=c1+1;cx++){const k=cy*this.cols+cx;if(cx<0||cy<0||cx>=this.cols||cy>=this.rows||this.view.has(k))continue;ring.push([(cx-mx)*dx+(cy-my)*dy,Math.hypot(cx-mx,cy-my),k])}
      ring.sort((a,b)=>b[0]-a[0]||a[1]-b[1]);ring.length=Math.min(ring.length,Math.max(0,this.cap-this.view.size));
      for(let i=ring.length-1;i>=0;i--){const k=ring[i][2],c=this.tiles.get(k);if(c){this.tiles.delete(k);this.tiles.set(k,c)}}
      this.queue=miss.concat(ring.map(q=>q[2]).filter(k=>!this.tiles.has(k)));const keep=new Set(this.queue);
      for(const [k,j] of this.jobs)if(!keep.has(k)){this.jobs.delete(k);this.drop(j.cv)}
      this.step(miss.length?2*T.slice:T.slice)}
    // queued tiles painted for ms, a band of rows at a time (a tile's painting resumes where it stopped)
    step(ms){const t0=performance.now();while(this.queue.length&&performance.now()-t0<ms){const k=this.queue[0];if(this.tiles.has(k)){this.queue.shift();continue}const j=this.start(k);
      while(performance.now()-t0<ms)if(j.gen.next().done){this.painted++;this.put(k,j.cv);this.queue.shift();break}}}
    // what it holds, bytes: its tiles, the canvases kept for reuse, the overview, the canopy layer, the small map
    bytes(){const px=c=>c?c.width*c.height*4:0;let t=0,p=0;for(const c of this.tiles.values())t+=px(c);for(const c of this.pool)p+=px(c);for(const j of this.jobs.values())p+=px(j.cv);
      return{tiles:t,n:this.tiles.size,pool:p,over:px(this.over),canopy:this.canopy&&this.canopy.half?px(this.canopy.half):0,mini:px(this.mini)}}
  }
  PX.BattleGround=BattleGround;
  // a battle's ground painted (as PX.battleGround) and kept by tiles: a PX.BattleGround (R16; setup.js BattleSetup.paint)
  PX.battleGroundSteps=function*(spec){const cv=yield* paint(spec,null),W=cv.width,H=cv.height,PL=cv.plan,G=new BattleGround(W,H,(x,y,w,h,out)=>paint(PL.spec,PL,[x,y,w,h],out));
    for(const k of ['props','trees','decor','water','under','plan'])if(cv[k]!==undefined)G[k]=cv[k];
    yield 1;G.mini=PX.battleGroundMini(spec,cv);yield 1;
    // (its tiles cut from the whole, the nearest the middle kept; the overview when they cannot all be)
    const ks=[...Array(G.cols*G.rows).keys()],d=k=>{const [x,y,w,h]=G.rect(k);return Math.hypot(x+w/2-W/2,y+h/2-H/2)};ks.sort((a,b)=>d(b)-d(a));
    for(const [i,k] of ks.slice(-G.cap).entries()){if(i&&!(i&3))yield 1;const [x,y,w,h]=G.rect(k);G.put(k,PX.canvas(w,h,g=>g.drawImage(cv,-x,-y)))}
    if(ks.length>G.cap){yield 1;G.over=PX.canvas(Math.ceil(W/2),Math.ceil(H/2),g=>{g.imageSmoothingEnabled=true;g.imageSmoothingQuality='low';g.drawImage(cv,0,0,W,H,0,0,W/2,H/2)})}
    return G};
  /* the woods' canopy (a level of detail for a big field seen zoomed out: render.js): every standing tree of a ground (cv.props, dk 1)
     painted once, in its order, into one clear layer the size of the field, so thousands of trees are one picture to draw rather
     than one each; made when first asked and kept on the ground (ground.canopy). The same pixels as the sprites drawn one by one over
     nothing; the cliff faces and mountains (dk 2, 3) stay sprites. ground.trees: how many trees it has. A tiled ground's (R16) is
     held at half resolution (each 2×2 of the full layer averaged, made a band of rows at a time): {width, height (the field's),
     half, drawView} */
  const CANOPY_BAND=64;
  PX.battleCanopy=ground=>{if(ground.canopy)return ground.canopy;
    if(!(ground instanceof BattleGround))return ground.canopy=PX.canvas(ground.width,ground.height,g=>{for(const p of ground.props||[])if(p.dk===1)g.drawImage(p.s,p.dx,p.dy)});
    const W=ground.width,H=ground.height,B=CANOPY_BAND,T=(ground.props||[]).filter(p=>p.dk===1),strip=PX.canvas(W,B),sg=strip.getContext('2d');
    const half=PX.canvas(Math.ceil(W/2),Math.ceil(H/2),g=>{g.imageSmoothingEnabled=true;g.imageSmoothingQuality='low';
      for(let y=0;y<H;y+=B){sg.clearRect(0,0,W,B);for(const p of T){const b=p.box;if(b[3]>=y&&b[1]<y+B)sg.drawImage(p.s,p.dx,p.dy-y)}g.drawImage(strip,0,0,W,B,0,y/2,W/2,B/2)}});
    return ground.canopy={width:W,height:H,half,drawView(g,x0,y0,x1,y1){const a=Math.max(0,Math.floor(x0/2)-1),b=Math.max(0,Math.floor(y0/2)-1),c=Math.min(half.width,Math.ceil(x1/2)+1),d=Math.min(half.height,Math.ceil(y1/2)+1);if(c>a&&d>b)g.drawImage(half,a,b,c-a,d-b,a*2,b*2,(c-a)*2,(d-b)*2)}}};

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
  PX.battleGroundMini=(spec,ground)=>{if(ground&&ground.mini)return ground.mini;const C=spec.C,R=spec.R,cs=spec.cs||16,P=PX.GROUND_PAL[spec.climate]||PX.GROUND_PAL.grass,lvl=spec.lvl||new Uint8Array(C*R),kind=spec.kind||new Uint8Array(C*R),U=ground&&ground.under,WL=spec.wall&&spec.wall.length===C*R?spec.wall:null,RP=(P.rock||PX.GROUND_PAL.grass.rock);
    return PX.canvas(C,R,g=>{const img=g.createImageData(C,R),M=img.data,G=ground?ground.getContext('2d').getImageData(0,0,ground.width,ground.height):null,B1=hx(P.base[1]),HI=hx(P.hi),LN=hx(P.line),LF=hx(P.leaf[3]),WA=hx(P.water[1]);
      for(let j=0;j<R;j++)for(let i=0;i<C;i++){const o=(j*C+i)*4,k=kind[j*C+i],l=lvl[j*C+i];let c=[0,0,0],n=0;
        if(G){for(let y=j*cs+1;y<Math.min(G.height,(j+1)*cs);y+=2)for(let x=i*cs+1;x<Math.min(G.width,(i+1)*cs);x+=2){const q=(y*G.width+x)*4;c[0]+=G.data[q];c[1]+=G.data[q+1];c[2]+=G.data[q+2];n++}}
        c=n?c.map(v=>v/n):B1.slice();const m=(d,t)=>{c=c.map((v,z)=>v+(d[z]-v)*t)};if(U&&k!==6&&U[(j*C+i)*3]>=0)c=[U[(j*C+i)*3],U[(j*C+i)*3+1],U[(j*C+i)*3+2]];
        // (a river: the deep darker, a ford lighter (ice in the frost), a bridge its make, so the crossings read)
        if(l)m(HI,.12*l);if(k===1&&P.species.length)m(LF,.4);else if(k===2)m(WA,.45);else if(k===4)m(hx(P.riv.w[3]),.5);else if(k===3)m(hx(P.riv.ice?P.riv.ice[0]:P.riv.bed),.45);
        else if(k===5)m(hx(P.riv.bridge==='stone'?P.riv.stone[0]:P.riv.wood[0]),.7);
        else if(k===6){const h=spec.rockH&&spec.rockH[j*C+i]||3;m(hx(RP.c[RP.s?3:2]),.9);if(h>=3)m(hx(RP.c[RP.s?2:1]),.45);if(RP.s&&h>=4)m(hx(RP.s[1]),.25)}
        if(WL){let e=0;for(const [a,b,bt,ob] of [[1,0,1,4],[-1,0,4,1],[0,1,2,8],[0,-1,8,2]]){const x=i+a,y=j+b;if(x<0||y<0||x>=C||y>=R||lvl[y*C+x]<=l)continue;e=Math.max(e,(WL[j*C+i]&bt)||(WL[y*C+x]&ob)?2:1)}if(e)m(LN,e===2?.9:.4)}
        else if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const x=i+a,y=j+b;return x>=0&&y>=0&&x<C&&y<R&&lvl[y*C+x]>l}))m(LN,.4);
        M[o]=c[0];M[o+1]=c[1];M[o+2]=c[2];M[o+3]=255}
      g.putImageData(img,0,0)})};
})(window.PX=window.PX||{});
