'use strict';
/* ---------- the world lab (doc/OPEN_WORLD_DESIGN.md phase 0; the owner, 2026-11-15: "Ok show me"): one stretch of land at the one
   pixel scale (1 world px = 1 figure px = 1 battle px), the land a height field drawn in layers you can see and climb. Opened
   straight from disk (engine/worldlab.html); nothing in the game reads it.
   The land: e(x, y), its height in levels (0 the sea's edge), a smooth field: the sea in the south-west, a beach and dunes, the land
   rising in terraces to a range of two peaks in the north-east with a saddle between them (the pass), a hill in the middle, a
   village on a flat shelf by the shore and a road from it up to the pass in switchbacks, its grade held to LAB.road.grade (cut into
   the hill on one side, built up on the other). Each pixel stands level × lh px higher on the screen (lh: the owner's "make it
   adjustable"); a terrace is flat at its level and its south face shows below it (an earth bank for a gentle step, a rock face with
   a ledge at every level for a steep one); the road and its shoulders are smooth, not stepped.
   Walking: by the slope (g, levels a px) where you step: flat, slope (uphill slower, downhill faster), steep (on foot, slow), cliff
   (only a climber, slowly, on stamina); water no one. Painted once (and again when lh changes) with a depth buffer: for every
   screen pixel the world y of the ground drawn there, which hides what stands behind a ridge and turns a click into a place. ---------- */
(function(PX){
  // the lab's numbers: the stretch (px), the cell (the battle's), lh (px a level: the owner's slider, lhMin to lhMax), the levels
  // where the beach, dunes, bare rock and snow begin, the peaks and the hill ([x, y, radius as shares of W, height in levels]),
  // the village's shelf, the road (its width, shoulders and most levels a px along it), the walk (px a second, the battle's
  // militia), steps: the range's shelves (a rise every band levels, as sharp as sharp where its noise (sc px) passes at; the
  // ground drawn in steps only as steep as from levels a px, wholly by to: gentler ground is smooth), the
  // slope classes (g at least: slope, steep, cliff) and what each does (speed up and down, stamina a second), the woods (noise
  // scale and threshold), the zoom (screen px a world px; phoneZoom on a screen narrower than phone px).
  // The river (the owner, 2026-11-15: "add rivers water and etc"): from a tarn (its ellipse) high on the range down to the sea along
  // pts (shares of W, H), meandering meander px; half as wide as w[0] at its source to w[1] at its mouth (px), its banks bank px; its
  // surface never rising downstream, stepped by levels (a fall where it drops); a stream no wider than wade px is waded; a ford at
  // ford (a share of its length), the mill beside it at mill; where its surface comes down to mouth levels it runs on at the sea's
  // level through the beach into the sea, widening by widen of itself (its mouth); past the shore it fans out (fanW more of its width)
  // and fades into the sea over fan points (2 px each), its muddy plume (plume at most) fading with it. The road (the owner: "make those road more realistic"): a curve
  // through its points, ruts rut px either side of its crown, a grassy crown on its flat stretches, puddles in the ruts where it is
  // flat (puddle: the noise past which), its edge ragged by edge px; a stone parapet where it runs along a drop of wall levels.
  // Its half-width wanders by vary of itself; its two wheel tracks at track of it from the middle, wandering wander px; gravel: a
  // share of its outer ground that is loose stones. Its bends (the owner, 2026-11-15: "looks weird for roads when have a sharp
  // turn"): each corner a round arc of bend px (less where its legs are short), climbed at turnGrade of the grade (a hairpin
  // nearly level); the ground between two legs of it more than legs points apart takes both legs' heights, so a switchback's
  // inside is one smooth bank
  const LAB={W:2048,H:1280,cell:16,lh:8,lhMin:4,lhMax:16,seed:7,
    beach:.45,dune:.95,rock:9,snow:11.5,shore:{wet:5,sand:34,dune:80},
    peaks:[[.66,.15,.26,11],[.93,.36,.24,9.5]],steps:{band:3,sharp:16,sc:110,at:.38,from:.08,to:.16},hill:[.40,.42,.14,2.2],shelf:{x:.21,y:.73,rx:190,ry:120,e:1.4},
    road:{w:26,sh:22,grade:1/34,bend:30,turnGrade:.35,legs:40,rut:5,edge:3,puddle:.74,wall:2,vary:.18,track:.42,wander:1.3,gravel:.07,pts:[[.13,.80],[.21,.73],[.31,.69],[.42,.61],[.50,.53],[.60,.50],[.70,.47],[.62,.41],[.73,.36],[.67,.31],[.79,.26],[.86,.14],[.88,0]]},
    // (the bridge (the owner, 2026-11-15: "the bridge should be a full bridge structure"): its deck clear levels over the water, the
    //  road ramped up to it; a pile every pile px along it, braced between; its rails rail px high on a post every post px; it is
    //  a true rectangle (the owner: "the bridge edge should be equal"): as wide as the road less inset px a side, its sides straight
    //  and parallel, its ends square across the road over points (2 px each) past the water each side, its deck level end to end;
    //  its ends resting on abut points of the road's own fill (its abutments), so no cut face stands under them)
    bridge:{clear:1.4,pile:12,rail:5,post:8,over:7,inset:1,abut:4},
    river:{pts:[[.588,.118],[.565,.20],[.525,.28],[.475,.36],[.435,.46],[.395,.55],[.355,.62],[.338,.70],[.343,.79],[.328,.88],[.31,1]],
      w:[2.5,11],bank:9,meander:14,ford:.5,mill:.64,mouth:.15,widen:1.2,fan:60,fanW:1.6,plume:.35,tarn:{x:.597,y:.10,rx:48,ry:26}},
    walk:38,run:1.6,
    cls:{slope:.035,steep:.11,cliff:.22},
    // (depth, in levels (a level about 0.85 m): past bands[0] ankle-deep, [1] knee, [2] waist, beyond it you swim; speed and cut
    //  (px of a man under the water) by each (dry, ankle, knee, waist, swimming); clear: how deep the bed still shows; swimCost: a
    //  cell of deep water to the way-finder; river: its depth at its middle from source to mouth; ford: its share there; tarn: its
    //  depth at the middle)
    depth:{bands:[.12,.35,.8],speed:[1,.85,.6,.35,.3],cut:[0,1,4,8,12],clear:.9,riverClear:.55,swimCost:9,river:[.2,1.5],ford:.25,tarn:1.6},
    speed:{flat:1,road:1.1,sand:.85,dune:.8,snow:.55,wood:.85,grass:1,meadow:1,ice:.8,up:.5,down:1.15,steep:.3,cliff:.16},
    sta:{slope:.03,steep:.08,cliff:.18,wade:.04,swim:.12,rest:.06,heat:0},
    woods:{sc:170,at:.56,step:11,fringe:.06,dense:.62},
    // (the trees' kinds by where they stand (the owner, 2026-11-15: "improve variety of trees"): each place's mix, by weight. Waterside:
    //  within near.river px of the river's middle; village: within near.village of the shelf's size; hills and mountain: from those
    //  levels (from); snow: from this many levels below the bare rock's line the conifers carry snow. young: the chance a tree at the woods' edge is young; old: that one deep
    //  in them is an old giant)
    trees:{lowland:{oak:5,beech:3,birch:2.5,ash:2,maple:.6,poplar:.4,dead:.25},waterside:{willow:4,alder:3,birch:1,poplar:1},
      hills:{pine:4,fir:3,birch:1.5,oak:1,dead:.3},mountain:{fir:4,spruce:4,pine:1,dead:.5},village:{apple:3,oak:1,poplar:1},
      near:{river:40,village:1.8},from:{hills:3.5,mountain:5.5,snow:-1.6},young:.5,old:.1},
    // (the layer of things standing on the land (the owner, 2026-11-15: "another layer to add on boulder trees etc."): on a grid of
    //  step px, the chance of each by its ground: bushes in the woods, at their edges and in the grass; saplings; boulders and
    //  stones on the grass, the rock and the scree; stones on the river's banks and in its shallows (no deeper than shallow); logs
    //  and stumps in the woods; ferns in the woods and at their edges, mushrooms on their floor, patches of flowers in the grass,
    //  most in the meadows; cattails on the banks)
    // (the grass (the owner, 2026-11-15: "grasses ... animated like flow with the wind or when character move on"): a clump every
    //  step px where its ground grows it, at the chance of its kind, thicker in patches (patch: their noise's scale); swaying with the
    //  wind (wind: its strength, the panel's slider; gust: px a wave of it spans, and how fast it rolls), bent away from a man
    //  within push px (most lean px at most), springing back over spring s)
    grass:{step:6,chance:{grass:.38,meadow:.55,dune:.32,wood:.12,bank:.3,cut:.15,oasis:.4},kinds:{bank:'grass',cut:'grass',oasis:'grass'},patch:38,wind:1,gust:[90,.65],push:12,lean:3,spring:1.4},
    nature:{step:7,bush:{wood:.08,edge:.16,grass:.008},sapling:.012,boulder:{grass:.0015,rock:.012},stone:{grass:.004,rock:.03,scree:.05,bank:.05,river:.04},shallow:.3,log:.012,stump:.008,
      fern:{wood:.06,edge:.03},mushroom:.014,flowers:{meadow:.035,grass:.008},cattail:.08,agave:0,bones:0,lily:0,pondReeds:0},
    // (how the things on the land look: rock (its tones: grey, sand or cold), bush (its leaves: oak for the temperate mix, else one
    //  palette), snow (caps on everything standing), moss (how much on rocks); cool: the tint high land takes; footprints (the ground
    //  kinds that take them, fading over fade s, their colour); snowfall: flakes on the screen; mist: banks of it drifting)
    look:{rock:'grey',bush:'oak',snow:false,moss:1},cool:[60,84,64],prints:{kinds:['snow','sand','dune','wet'],fade:18,col:[96,78,52]},snowfall:0,mist:0,
    oasis:0,ice:null,pools:null,
    // (the climates (the owner, 2026-11-15: "add them to the lab first before implement the map generator"): the same land in
    //  another climate, each a patch over these numbers (its lists of kinds replaced whole, the rest merged) and over the colours
    //  (CLIMATE_COL, from the battle map's PX.GROUND_PAL where it has them). Desert: no snow, few and thin woods (scrub), green ground
    //  (an oasis) within oasis px of the river and the tarn, the heat spending stamina (sta.heat a second on the move, not on the
    //  green nor in the water). Frost: snow lower down; ice where the sea is shallower than ice.sea levels (by noise), on the tarn,
    //  and shelf ice along the river past ice.river of its half-width from its middle; footprints; snowfall. Swamp: pools on the low
    //  land (below pools.lo levels) where its noise (sc px) passes at, as deep as its excess times deep; bog in the meadows; mist)
    climate:'temperate',
    climates:{
      desert:{snow:99,woods:{at:.66,dense:.3},oasis:22,sta:{heat:.045},cool:[176,124,84],speed:{grass:.92,meadow:1,wood:.88},
        trees:{lowland:{acacia:4,dead:2,palm:.5},waterside:{palm:6,acacia:1},hills:{acacia:2,dead:2},mountain:{dead:1,acacia:1},village:{palm:4,acacia:1},near:{river:60}},
        grass:{chance:{grass:.05,meadow:.015,dune:.12,wood:.2,bank:.4,cut:.03,oasis:.5},kinds:{grass:'dry',meadow:'dry',wood:'dry',cut:'dry',dune:'dune',bank:'grass',oasis:'grass'}},
        nature:{bush:{wood:.07,edge:.03,grass:.004},sapling:0,boulder:{grass:.004,rock:.02},stone:{grass:.012},log:0,stump:0,fern:{wood:0,edge:0},mushroom:0,
          flowers:{meadow:.003,grass:.002},cattail:.05,agave:.012,bones:.0015},
        look:{rock:'sand',bush:'dry',snow:false,moss:0},prints:{kinds:['sand','dune','wet','grass'],fade:18,col:[150,112,66]}},
      frost:{snow:6.5,ice:{sea:.45,river:.55},cool:[196,206,226],speed:{grass:.9,meadow:.62,wood:.7,dune:.75,ice:.8},
        trees:{lowland:{spruce:4,fir:3,winterbirch:2,dead:.6},waterside:{winterbirch:3,spruce:2},hills:{spruce:4,fir:2,dead:.4},mountain:{spruce:3,fir:2,dead:1},village:{spruce:2,winterbirch:1},from:{snow:-99}},
        grass:{chance:{grass:.3,meadow:.03,dune:.12,wood:.02,bank:.2,cut:.1},kinds:{grass:'frost',meadow:'frost',wood:'frost',dune:'frost',bank:'frost',cut:'frost'}},
        nature:{bush:{wood:.05,edge:.08,grass:.004},sapling:0,fern:{wood:0,edge:0},mushroom:0,flowers:{meadow:0,grass:0},cattail:.03,log:.01,stump:.01},
        look:{rock:'cold',bush:'dark',snow:true,moss:0},prints:{kinds:['snow','meadow','wood','dune','sand','wet','ice'],fade:24,col:[110,130,170]},snowfall:140},
      swamp:{pools:{at:.56,lo:4,deep:3.5,sc:44},cool:[56,74,58],speed:{grass:.85,meadow:.6,wood:.78},
        trees:{lowland:{bogtree:4,alder:3,willow:2,dead:2},waterside:{willow:3,bogtree:3,alder:1},hills:{alder:2,birch:2,oak:1,dead:1},mountain:{fir:2,spruce:1,birch:1,dead:1},village:{willow:1,alder:1}},
        grass:{chance:{grass:.5,meadow:.3,dune:.35,wood:.22,bank:.55,cut:.2},kinds:{grass:'marsh',meadow:'marsh',dune:'marsh',bank:'marsh',cut:'marsh',wood:'wood'}},
        nature:{bush:{wood:.06,edge:.1,grass:.01},boulder:{grass:.0005},stone:{grass:.0015},log:.025,stump:.016,fern:{wood:.06,edge:.04},mushroom:.035,flowers:{meadow:.006,grass:.004},cattail:.2,lily:.1,pondReeds:.12},
        look:{rock:'grey',bush:'dark',snow:false,moss:1.6},prints:{kinds:['meadow','wet','sand'],fade:14,col:[44,38,24]},mist:16}},
    // (the biomes blended (the owner, 2026-11-15: "make the transition between biomes more blend"): each ground's own colour shifted
    //  toward its neighbours' over r px, k of the way, the edge ragged by a warp of warp px)
    blend:{r:8,k:.85,warp:10},
    // (a road's cutting: earth begins to show at slope from, all earth (but its tufts) by to; rag: how ragged that is; earth: its most
    //  share; lit: the warm earth of its upper part)
    cut:{from:.04,to:.2,rag:.9,earth:.92,lit:[176,140,96]},zoom:2,phoneZoom:1.5,phone:700};

  const hsh=(x,y,s)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1274126177);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
  const vn=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),a=hsh(xi,yi,s),b=hsh(xi+1,yi,s),c=hsh(xi,yi+1,s),d=hsh(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
  const fbm=(x,y,s,n)=>{let t=0,a=.5,f=1,m=0;for(let i=0;i<n;i++){t+=vn(x*f,y*f,s+i*17)*a;m+=a;a*=.5;f*=2}return t/m};
  const smooth=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
  const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];

  // (shore: px from the water: wet sand, then the beach, then the dunes)
  // the colours (the battle map's grass palette, PX.GROUND_PAL, where it has them)
  const GP=PX.GROUND_PAL.grass;
  const COL={grass:GP.base.map(hex),meadow:[[92,138,60],[108,152,68],[126,166,80]],wood:[[52,84,40],[60,94,44],[70,104,50]],
    sand:[[222,204,150],[232,216,166],[240,226,180]],wet:[[188,168,120],[198,178,128]],dune:[[204,190,128],[180,176,112]],
    road:[[150,122,84],[164,136,94],[178,150,104]],rut:[120,96,66],
    rock:GP.rock.c.map(hex),snow:[[226,232,240],[240,244,250],[250,252,255]],
    face:GP.face.map(hex),bank:[[120,98,66],[98,80,56],[78,64,46]],lip:[70,104,48],
    sea:[[120,196,200],[70,150,186],[44,104,160],[30,72,128]],foam:[236,244,246],
    tuft:GP.tuft.map(hex),flower:[[230,214,120],[220,140,160],[236,236,236],[150,150,220]],drift:[126,100,72],shell:[244,236,220],marram:[[168,170,96],[132,140,74]],
    scree:[[150,148,138],[118,116,110]],
    river:[[118,190,196],[84,156,184],[58,118,160]],tarn:[[96,160,190],[54,104,150]],fall:[[236,244,248],[182,216,232],[134,180,208]],
    mud:[[104,96,62],[86,80,52]],reed:[[120,150,64],[96,124,52],[150,118,72]],
    shallow:[[150,212,204],[90,170,190],[52,118,170],[30,72,128]],
    // (a river's own water (the owner, 2026-11-15: "why river has darker color than ocean?"): clear in its shallows, then green-grey
    //  and murky as it deepens, never the open sea's deep blue)
    riverwater:[[150,196,184],[116,160,150],[90,130,124],[78,114,112]],seabed:[[214,196,146],[196,178,128]],pebble:[[150,140,118],[122,114,98],[170,160,136],[104,98,86]],tarnbed:[[96,100,98],[78,82,84]],
    plank:[[154,112,70],[138,98,60],[166,124,80]],beam:[[92,64,40],[70,48,30]],stone:[[176,170,156],[150,144,132],[118,114,106]],puddle:[[118,138,150],[150,172,184]],
    oasis:GP.base.map(hex),poolbed:[[70,62,42],[58,52,36]],pool:[[132,150,136],[104,124,114],[82,102,96],[66,84,80]],ice:[[198,222,234],[184,212,228],[214,234,242]],litter:[[150,96,44],[172,124,52],[128,82,42]]};
  // (each climate's colours over these: its grounds (desert: firm sand, cracked clay, scrub; frost: tundra, snowfields, a snowy
  //  woods floor; swamp: marsh, bog, mossy floor), its rock and faces, its waters; the battle map's palettes where it has them)
  const GPd=PX.GROUND_PAL,gp=(c,k)=>GPd[c][k].map(hex);
  const CLIMATE_COL={
    desert:{grass:[[214,184,128],[224,196,140],[204,174,120]],meadow:[[196,152,104],[206,164,114],[186,142,96]],wood:[[188,160,108],[176,148,98],[198,170,116]],
      rock:GPd.desert.rock.c.map(hex),face:gp('desert','face'),scree:[[184,138,98],[154,110,78]],bank:[[156,120,78],[132,98,62],[106,78,52]],lip:[200,176,122],
      tuft:gp('desert','tuft'),flower:[[230,200,90],[220,150,110],[236,226,200],[200,170,120]],marram:[[176,164,98],[150,138,80]],
      shallow:[[130,214,206],[74,180,194],[46,126,170],[28,80,132]],riverwater:[[146,200,190],[98,160,164],[74,130,140],[56,104,112]],
      oasis:[[86,132,52],[100,146,60],[116,158,70]],litter:[[150,126,84],[128,104,70],[170,146,100]]},
    frost:{grass:[[138,146,112],[152,158,122],[126,134,104]],meadow:[[222,230,240],[236,242,250],[208,218,232]],wood:[[214,222,234],[228,236,246],[198,208,224]],
      sand:[[176,176,168],[190,190,182],[160,160,154]],wet:[[140,142,140],[152,154,152]],dune:[[214,220,228],[196,204,214]],
      rock:GPd.frost.rock.c.map(hex),face:gp('frost','face'),scree:[[160,166,178],[126,132,146]],bank:[[112,108,100],[94,90,84],[76,72,68]],lip:[226,232,242],
      shallow:[[150,186,196],[100,146,170],[64,100,138],[38,64,98]],seabed:[[150,150,144],[128,128,124]],riverwater:[[150,182,190],[110,146,158],[84,118,134],[70,100,118]],
      tuft:gp('frost','tuft'),flower:[[236,240,246],[200,210,226],[236,240,246],[200,210,226]],marram:[[184,182,150],[154,154,126]],litter:[[96,104,96],[120,110,90],[80,88,84]]},
    swamp:{grass:[[76,96,52],[88,108,58],[68,88,46]],meadow:[[92,82,52],[104,92,58],[82,74,46]],wood:[[52,72,40],[60,82,44],[46,64,36]],
      sand:[[150,140,110],[162,152,120],[140,130,100]],wet:[[118,110,86],[128,120,94]],dune:[[140,140,96],[120,124,80]],face:gp('swamp','face'),
      shallow:[[126,170,150],[86,136,132],[56,100,116],[36,70,92]],riverwater:[[104,112,76],[84,94,62],[66,76,50],[54,62,42]],
      bank:[[86,74,50],[72,62,42],[58,50,36]],lip:[72,92,46],mud:[[78,70,46],[64,58,38]],tuft:gp('swamp','tuft'),flower:[[230,206,70],[236,236,220],[200,170,210],[230,206,70]],
      litter:[[96,80,44],[110,92,50],[80,66,38]]}};
  // (a climate laid over the lab's own numbers and colours; the panel's level height, zoom and wind kept)
  const LAB0=JSON.parse(JSON.stringify(LAB)),COL0=JSON.parse(JSON.stringify(COL)),
    WHOLE=new Set(['trees.lowland','trees.waterside','trees.hills','trees.mountain','trees.village','grass.kinds','look','prints.kinds']);
  const merge=(a,b,path)=>{for(const k in b){const q=path?path+'.'+k:k,v=b[k];if(v&&typeof v==='object'&&!Array.isArray(v)&&!WHOLE.has(q)&&a[k]&&typeof a[k]==='object')merge(a[k],v,q);else a[k]=JSON.parse(JSON.stringify(v))}};
  function applyClimate(name){const keep={lh:LAB.lh,zoom:LAB.zoom,wind:LAB.grass.wind};
    for(const k in LAB0)if(k!=='climates')LAB[k]=JSON.parse(JSON.stringify(LAB0[k]));LAB.lh=keep.lh;LAB.zoom=keep.zoom;LAB.grass.wind=keep.wind;
    merge(LAB,LAB.climates[name]||{},'');LAB.climate=name;
    for(const k in COL)delete COL[k];Object.assign(COL,JSON.parse(JSON.stringify(COL0)),JSON.parse(JSON.stringify(CLIMATE_COL[name]||{})))}

  // the land's height (levels) at a px, before the road and the shelf
  function elev(x,y){const W=LAB.W,H=LAB.H,u=x/W,v=y/H,s=LAB.seed;
    let e=-1.6+(u*.62+(1-v)*.52)*6+(fbm(x/240,y/240,s+11,4)-.5)*3.4;
    // (the range stepped: shelves with a sharp rise every band levels (a cliff where the noise says, a ramp where it does not))
    let m=0;for(const [px,py,r,h] of LAB.peaks){const d=Math.hypot(x-px*W,y-py*H)/(r*W);if(d<1)m+=h*Math.pow(1-d,1.2)*(.8+.4*fbm(x/80,y/80,s+23,3))}
    if(m>0){const M=LAB.steps,k=m/M.band,f=k-Math.floor(k),sh=1+(M.sharp-1)*smooth((fbm(x/M.sc,y/M.sc,s+24,2)-M.at)/.2);e+=(Math.floor(k)+Math.pow(f,sh))*M.band}
    {const [px,py,r,h]=LAB.hill,d=Math.hypot(x-px*W,y-py*H)/(r*W);if(d<1)e+=h*smooth(1-d)}
    const S=LAB.shelf,ds=Math.hypot((x-S.x*W)/S.rx,(y-S.y*H)/S.ry);if(ds<1.4){const k=smooth((1.4-ds)/.4);e=e+(S.e-e)*k}
    return e}

  // a Catmull-Rom curve through P (px), a point every step px
  function spline(P,step){const out=[];for(let i=0;i+1<P.length;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)],n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
      for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;out.push([0,1].map(j=>.5*(2*p1[j]+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3)))}}
    out.push(P[P.length-1].slice());return out}
  // every px within reach of the polyline pts: D its distance, I where along it (a fractional index)
  function bandOf(pts,reach){const W=LAB.W,H=LAB.H,D=new Float32Array(W*H).fill(1e9),I=new Float32Array(W*H);
    for(let i=0;i+1<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[i+1],dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;
      for(let y=Math.max(0,Math.floor(Math.min(ay,by)-reach));y<=Math.min(H-1,Math.ceil(Math.max(ay,by)+reach));y++)
        for(let x=Math.max(0,Math.floor(Math.min(ax,bx)-reach));x<=Math.min(W-1,Math.ceil(Math.max(ax,bx)+reach));x++){
          const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l2)),d=Math.hypot(x-ax-dx*t,y-ay-dy*t),j=y*W+x;if(d<D[j]){D[j]=d;I[j]=i+t}}}
    return {D,I}}
  const along=(A,f)=>{const i=Math.min(A.length-1,Math.floor(f)),j=Math.min(A.length-1,i+1),t=f-Math.floor(f);return A[i]+(A[j]-A[i])*t};

  // the road: its polyline (px), heights along it (the land's, the grade held by passes both ways, then smoothed), and every px
  // near it: its distance and the road's height there
  // a path through P with each corner rounded: straight legs and a circular arc of radius r (less where the legs are short) at each
  // turn; its points every step px, turn[i] 1 on an arc
  function filleted(P,r,step){const pts=[],turn=[],line=(a,b,f)=>{const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let k=0;k<n;k++){pts.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);turn.push(f)}};
    let from=P[0];
    for(let i=1;i<P.length-1;i++){const a=P[i-1],b=P[i],c=P[i+1],l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]),d1=[(b[0]-a[0])/l1,(b[1]-a[1])/l1],d2=[(c[0]-b[0])/l2,(c[1]-b[1])/l2],
        th=Math.acos(Math.max(-1,Math.min(1,d1[0]*d2[0]+d1[1]*d2[1]))),cr=d1[0]*d2[1]-d1[1]*d2[0];
      if(th<.05){line(from,b,0);from=b;continue}
      const L=Math.min(r*Math.tan(th/2),.45*l1,.45*l2),rr=L/Math.tan(th/2),A=[b[0]-d1[0]*L,b[1]-d1[1]*L],sg=cr>0?1:-1,O=[A[0]-d1[1]*rr*sg,A[1]+d1[0]*rr*sg];
      line(from,A,0);const a0=Math.atan2(A[1]-O[1],A[0]-O[0]),n=Math.max(2,Math.ceil(rr*th/step));for(let k=0;k<n;k++){const q=a0+sg*th*k/n;pts.push([O[0]+Math.cos(q)*rr,O[1]+Math.sin(q)*rr]);turn.push(1)}
      from=[b[0]+d2[0]*L,b[1]+d2[1]*L]}
    line(from,P[P.length-1],0);pts.push(P[P.length-1].slice());turn.push(0);return {pts,turn}}
  // every px near the polyline pts: as bandOf, and D2, I2 the nearest of another part of it (gap points or more along it away)
  function bandOf2(pts,reach,gap){const W=LAB.W,H=LAB.H,D=new Float32Array(W*H).fill(1e9),I=new Float32Array(W*H),D2=new Float32Array(W*H).fill(1e9),I2=new Float32Array(W*H);
    for(let i=0;i+1<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[i+1],dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;
      for(let y=Math.max(0,Math.floor(Math.min(ay,by)-reach));y<=Math.min(H-1,Math.ceil(Math.max(ay,by)+reach));y++)
        for(let x=Math.max(0,Math.floor(Math.min(ax,bx)-reach));x<=Math.min(W-1,Math.ceil(Math.max(ax,bx)+reach));x++){
          const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l2)),d=Math.hypot(x-ax-dx*t,y-ay-dy*t),j=y*W+x,f=i+t;
          if(d<D[j]){if(D[j]<1e9&&Math.abs(I[j]-f)>gap){D2[j]=D[j];I2[j]=I[j]}D[j]=d;I[j]=f}else if(d<D2[j]&&Math.abs(I[j]-f)>gap){D2[j]=d;I2[j]=f}}}
    for(let j=0;j<W*H;j++)if(D2[j]<1e9&&Math.abs(I2[j]-I[j])<=gap)D2[j]=1e9;
    return {D,I,D2,I2}}

  function roadOf(E){const W=LAB.W,H=LAB.H,R=LAB.road,F=filleted(R.pts.map(([u,v])=>[u*W,v*H]),R.bend,2),pts=F.pts;
    const at=(x,y)=>E[Math.min(H-1,Math.max(0,Math.round(y)))*W+Math.min(W-1,Math.max(0,Math.round(x)))];
    let r=pts.map(([x,y])=>at(x,y));const ds=i=>2*R.grade*(F.turn[i]?R.turnGrade:1);
    for(let it=0;it<6;it++){for(let i=1;i<r.length;i++)r[i]=Math.min(Math.max(r[i],r[i-1]-ds(i)),r[i-1]+ds(i));for(let i=r.length-2;i>=0;i--)r[i]=Math.min(Math.max(r[i],r[i+1]-ds(i)),r[i+1]+ds(i))}
    for(let it=0;it<3;it++){const q=r.slice();for(let i=0;i<r.length;i++){let s=0,n=0;for(let j=-8;j<=8;j++){const k=i+j;if(k>=0&&k<r.length){s+=q[k];n++}}r[i]=s/n}}
    const {D,I,D2,I2}=bandOf2(pts,R.w/2+R.sh+2,R.legs),RE=new Float32Array(W*H),RE2=new Float32Array(W*H);for(let j=0;j<W*H;j++){if(D[j]<1e9)RE[j]=along(r,I[j]);if(D2[j]<1e9)RE2[j]=along(r,I2[j])}
    return {pts,r,turn:F.turn,D,I,RE,D2,I2,RE2}}

  // the river: its course (a curve, meandering), its surface along it (the land's, never rising downstream), its half-width; every
  // px near it: RV 1 water, 2 bank, 3 ford; RW the half-width there, RT px along it
  function riverOf(E){const W=LAB.W,H=LAB.H,V=LAB.river,s=LAB.seed,c=spline(V.pts.map(([u,v])=>[u*W,v*H]),2),n=c.length;
    const pts=c.map((p,i)=>{const a=c[Math.max(0,i-1)],b=c[Math.min(n-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,o=(fbm(i/45,.5,s+70,2)-.5)*2*V.meander*Math.min(1,i/40);return [p[0]-dy/l*o,p[1]+dx/l*o]});
    const at=(x,y)=>E[Math.min(H-1,Math.max(0,Math.round(y)))*W+Math.min(W-1,Math.max(0,Math.round(x)))];
    const rh=pts.map(([x,y])=>at(x,y));for(let i=1;i<n;i++)rh[i]=Math.min(rh[i],rh[i-1]-.0004);
    const rw=pts.map((_,i)=>V.w[0]+(V.w[1]-V.w[0])*Math.pow(i/(n-1),.8)+(fbm(i/30,2.5,s+71,2)-.5)*1.6);
    // (where it meets the sea: the first of its points on the sea, as the land lay)
    let sea=n;for(let i=0;i<n;i++){if(at(pts[i][0],pts[i][1])<0){sea=i;break}}
    const {D,I}=bandOf(pts,V.w[1]*(1+V.widen+V.fanW)+V.bank+3),PL=new Float32Array(W*H),RV=new Uint8Array(W*H),RW=new Float32Array(W*H),RT=new Float32Array(W*H),DP=new Float32Array(W*H),fi=V.ford*(n-1),Dp=LAB.depth;
    for(let j=0;j<W*H;j++){if(D[j]>=1e9)continue;const f=I[j],h=along(rh,f),d=D[j];let w=along(rw,f);
      // (its mouth: once its surface is down to mouth levels it runs on at the sea's level, widening, through the beach into the sea)
      // (past the shore it fans out and fades into the sea: shallower, wider, its channel's edges soft, its plume fading)
      if(h<V.mouth){const out=Math.max(0,f-sea),fade=1-smooth(out/V.fan);if(fade<=0)continue;w*=1+V.widen*smooth((V.mouth-h)/V.mouth)+V.fanW*(1-fade);
        if(d<w){const q=d/w,soft=1-q*q;E[j]=Math.min(E[j],-.06*fade);if(fade>.15){RV[j]=1;RW[j]=w;RT[j]=f*2}DP[j]=Math.max(DP[j],(Dp.river[1]*soft*soft)*.8*fade+.05*fade);PL[j]=Math.max(PL[j],V.plume*fade*soft)}continue}
      if(d<w){E[j]=Math.min(E[j],h)-.001;RV[j]=Math.abs(f-fi)<w/2+5?3:1;RW[j]=w;RT[j]=f*2;
        // (deepest down its middle, deeper downstream; shallow at the ford)
        const base=Dp.river[0]+(Dp.river[1]-Dp.river[0])*f/(n-1),q=d/w;DP[j]=(base*(1-q*q)+.04)*(RV[j]===3?Dp.ford:1)}
      else if(d<w+V.bank){const tg=h+.5;if(E[j]>tg)E[j]=tg+(E[j]-tg)*smooth((d-w)/V.bank);RV[j]=2;RW[j]=w;RT[j]=f*2}}
    // (the tarn it rises from: still water, its rim a bank)
    const T=V.tarn,tx=T.x*W,ty=T.y*H,tl=Math.floor(at(tx,ty))-.001;
    for(let y=Math.max(0,Math.floor(ty-T.ry*1.6));y<Math.min(H,ty+T.ry*1.6);y++)for(let x=Math.max(0,Math.floor(tx-T.rx*1.6));x<Math.min(W,tx+T.rx*1.6);x++){const j=y*W+x,q=Math.hypot((x-tx)/T.rx,(y-ty)/T.ry)+(fbm(x/20,y/20,s+72,2)-.5)*.3;
      if(q<1){E[j]=tl;RV[j]=1;RW[j]=99;RT[j]=0;DP[j]=(1-q)*Dp.tarn+.05}else if(q<1.5&&RV[j]!==1){const tg=tl+.5;if(E[j]>tg)E[j]=tg+(E[j]-tg)*smooth((q-1)/.5);RV[j]=2;RW[j]=99}}
    return {pts,rh,rw,D,RV,RW,RT,DP,PL}}

  /* the land made: E (levels, the road and its shoulders in), smooth (1 where the ground is not stepped), kind (by px), g (slope:
     levels a px), gx/gy its way uphill. Kinds: 0 water, 1 wet sand, 2 sand, 3 dune, 4 grass, 5 meadow, 6 wood floor, 7 road,
     8 scree, 9 rock, 10 snow, 11 river (or the tarn), 12 ford, 13 bridge, 14 river bank, 15 a road's cutting or embankment (its
     shoulders where they are steep: earth, grass clinging to it) */
  const K={water:0,wet:1,sand:2,dune:3,grass:4,meadow:5,wood:6,road:7,scree:8,rock:9,snow:10,river:11,ford:12,bridge:13,bank:14,cut:15,oasis:16,pool:17,ice:18};
  const KNAME_ID=Object.keys(K).sort((a,b)=>K[a]-K[b]);
  const KNAME=['sea','wet sand','sand','dunes','grass','meadow','woods','road','scree','rock','snow','river','ford','bridge','river bank','road cutting','oasis','pool','ice'];
  function makeLand(){const t0=performance.now(),W=LAB.W,H=LAB.H,s=LAB.seed,E=new Float32Array(W*H),st=4,CW=W/st+2,CH=H/st+2,Cg=new Float32Array(CW*CH);
    for(let cy=0;cy<CH;cy++)for(let cx=0;cx<CW;cx++)Cg[cy*CW+cx]=elev(cx*st,cy*st);
    for(let y=0;y<H;y++){const cy=Math.floor(y/st),fy=y/st-cy;for(let x=0;x<W;x++){const cx=Math.floor(x/st),fx=x/st-cx,i=cy*CW+cx;
      E[y*W+x]=(Cg[i]*(1-fx)+Cg[i+1]*fx)*(1-fy)+(Cg[i+CW]*(1-fx)+Cg[i+CW+1]*fx)*fy}}
    const road=roadOf(E),river=riverOf(E),RV=river.RV,R=LAB.road,SM=new Uint8Array(W*H),KD=new Uint8Array(W*H);
    // (where the road crosses the river its deck stands bridge.clear levels over the water, the road ramped to it at its grade)
    let span=null;
    {const r=road.r,n=r.length,Bg=LAB.bridge;let a=-1,b=-1,wl=-1e9;
      for(let i=0;i<n;i++){const [x,y]=road.pts[i],j=Math.round(y)*W+Math.round(x);if(j>=0&&j<W*H&&(RV[j]===1||RV[j]===3)){if(a<0)a=i;b=i;wl=Math.max(wl,Math.floor(E[j]))}}
      if(a>=0){const i0=Math.max(0,a-Bg.over),i1=Math.min(n-1,b+Bg.over);let dh=wl+Bg.clear;for(let i=i0;i<=i1;i++)dh=Math.max(dh,r[i]);for(let i=i0;i<=i1;i++)r[i]=dh;span={i0,i1,hw:R.w/2-Bg.inset,h:dh}}
      const ds=2*R.grade;for(let it=0;it<4;it++){for(let i=1;i<n;i++)r[i]=Math.max(r[i],r[i-1]-ds);for(let i=n-2;i>=0;i--)r[i]=Math.max(r[i],r[i+1]-ds)}
      for(let j=0;j<W*H;j++){if(road.D[j]<1e9)road.RE[j]=along(r,road.I[j]);if(road.D2[j]<1e9)road.RE2[j]=along(r,road.I2[j])}}
    // (the road's edge ragged; over the river its deck (a bridge), the water left beside it)
    const RD=new Float32Array(W*H),HW=new Float32Array(W*H);for(let i=0;i<W*H;i++){const d=road.D[i];RD[i]=d>=1e9?d:d-(fbm((i%W)/26,((i/W)|0)/26,s+73,2)-.5)*2*R.edge;HW[i]=d>=1e9?0:R.w/2*(1+R.vary*(vn(road.I[i]/30,.5,s+95)-.5)*2)}
    // (the bridge's rectangle: on the span, nearer the road's line than its half-width; the rest of the span's width is the river and
    //  its banks as they are)
    const BR=new Uint8Array(W*H),OPEN=new Uint8Array(W*H);if(span)for(let i=0;i<W*H;i++){const f=road.I[i];if(road.D[i]<1e9&&f>=span.i0&&f<=span.i1){BR[i]=road.D[i]<span.hw?1:2;OPEN[i]=f>span.i0+LAB.bridge.abut&&f<span.i1-LAB.bridge.abut?1:0}}
    for(let i=0;i<W*H;i++){if(OPEN[i]&&road.D[i]<HW[i]+R.sh)continue;const d=RD[i],hw=HW[i];if(d<hw){E[i]=road.RE[i];SM[i]=1}else if(d<hw+R.sh&&RV[i]!==1&&RV[i]!==3){let rt=road.RE[i],k=smooth((d-hw)/R.sh);
        const d2=road.D2[i];if(d2<hw+R.sh){const w1=1/((d-hw+1)**2),w2=1/((Math.max(d2-hw,0)+1)**2);rt=(rt*w1+road.RE2[i]*w2)/(w1+w2);k*=smooth((d2-hw)/R.sh)}
        E[i]=rt+(E[i]-rt)*k;SM[i]=1}}
    const G=new Float32Array(W*H),GX=new Float32Array(W*H),GY=new Float32Array(W*H),o=3;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,a=E[y*W+Math.min(W-1,x+o)]-E[y*W+Math.max(0,x-o)],b=E[Math.min(H-1,y+o)*W+x]-E[Math.max(0,y-o)*W+x];GX[i]=a/(2*o);GY[i]=b/(2*o);G[i]=Math.hypot(GX[i],GY[i])}
    // (how far each px is from the water: two chamfer passes)
    const DW=new Float32Array(W*H);for(let i=0;i<W*H;i++)DW[i]=E[i]<0?0:1e6;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let d=DW[i];if(!d)continue;if(x>0)d=Math.min(d,DW[i-1]+1);if(y>0){d=Math.min(d,DW[i-W]+1);if(x>0)d=Math.min(d,DW[i-W-1]+1.414);if(x<W-1)d=Math.min(d,DW[i-W+1]+1.414)}DW[i]=d}
    for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;let d=DW[i];if(!d)continue;if(x<W-1)d=Math.min(d,DW[i+1]+1);if(y<H-1){d=Math.min(d,DW[i+W]+1);if(x<W-1)d=Math.min(d,DW[i+W+1]+1.414);if(x>0)d=Math.min(d,DW[i+W-1]+1.414)}DW[i]=d}
    const S=LAB.shelf,Wd=LAB.woods,B=LAB.shore,POOL=new Float32Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,e=E[i],g=G[i];let k;
      const wob=fbm(x/50,y/50,s+63,2)-.5,dw=DW[i];
      const rv=RV[i],onRoad=RD[i]<HW[i]&&!OPEN[i];
      if(e<0&&!rv)k=K.water;else if(rv===1)k=e<0?K.water:K.river;else if(rv===3)k=K.ford;else if(onRoad)k=K.road;
      else if(rv===2&&(river.RW[i]>50||river.D[i]<river.RW[i]+4))k=K.bank;
      else if(SM[i]&&g>=LAB.cls.slope*1.5&&e>=LAB.dune)k=K.cut;else if(dw<B.wet+wob*4)k=K.wet;else if(dw<B.sand+wob*24&&e<LAB.dune)k=K.sand;else if(dw<B.dune+wob*40&&e<LAB.dune+.6)k=K.dune;
      else if(e>=LAB.snow+(fbm(x/40,y/40,s+61,2)-.5)*1.6&&g<LAB.cls.cliff)k=K.snow;else if(e>=LAB.rock+(fbm(x/50,y/50,s+62,2)-.5)*2||g>=LAB.cls.cliff)k=K.rock;
      else if(g>=LAB.cls.steep&&e>2)k=K.scree;
      else{const inShelf=Math.hypot((x-S.x*W)/S.rx,(y-S.y*H)/S.ry)<1.2,w=fbm(x/Wd.sc,y/Wd.sc,s+41,3);
        k=!inShelf&&RD[i]>HW[i]+10&&!rv&&e>=1&&e<8&&w>Wd.at?K.wood:fbm(x/60,y/60,s+44,2)>.62?K.meadow:K.grass}
      // (the climate's own: the desert's green by the water; the frost's ice; the swamp's pools)
      const land=k===K.grass||k===K.meadow||k===K.wood;
      if(LAB.oasis&&(land||k===K.cut)&&river.D[i]-river.RW[i]<LAB.oasis*(.75+wob))k=K.oasis;
      if(LAB.ice){const I=LAB.ice;if(k===K.water&&!rv&&-e<I.sea*(.6+1.6*(wob+.5)))k=K.ice;else if(k===K.river&&(river.RW[i]>50||river.D[i]>river.RW[i]*I.river+wob*3))k=K.ice}
      if(LAB.pools&&land&&e<LAB.pools.lo&&RD[i]>HW[i]+8&&Math.hypot((x-S.x*W)/S.rx,(y-S.y*H)/S.ry)>1.35){const P=LAB.pools,m=fbm(x/P.sc,y/P.sc,s+150,3);if(m>P.at){k=K.pool;POOL[i]=Math.min(.7,.05+(m-P.at)*P.deep)}}
      KD[i]=k}
    // (every water px's depth: the sea's how far the land lies under it, the river's and the tarn's their own)
    const DP=new Float32Array(W*H);for(let i=0;i<W*H;i++){const k=KD[i];if(k===K.water)DP[i]=Math.max(-E[i],river.DP[i]);else if(k===K.river||k===K.ford)DP[i]=river.DP[i];else if(k===K.pool)DP[i]=POOL[i]}
    return {E,SM,KD,G,GX,GY,road,river,RD,HW,DP,DW,bridge:span,BR,ms:performance.now()-t0}}

  /* painting: the terrain canvas (W x H+T, T the highest lift), its depth (the world y of the ground at each of its px, -1 none)
     and the walk map. Column by column, north to south: each px's top at y - lift + T; where the ground ahead is lower, this px's
     south face fills down to it (a bank or a rock face, a ledge line at every level, snow on a high ledge's lip) */
  function paint(L){const t0=performance.now(),W=LAB.W,H=LAB.H,lh=LAB.lh,s=LAB.seed,E=L.E,SM=L.SM,KD=L.KD,G=L.G;
    const lift=new Int16Array(W*H);let top=0;
    // (gentle ground rises smoothly, steep ground in steps: a px's height between its smooth height and its terrace's by how steep it
    //  is (the owner, 2026-11-15: "the layer line is unrealistic": every level's edge had been a sharp bank, on a meadow too))
    const STW=new Float32Array(W*H),St=LAB.steps;
    for(let i=0;i<W*H;i++){const e=E[i];let h;if(e<=0)h=0;else if(SM[i])h=Math.round(e*lh);else{const w=smooth((G[i]-St.from)/(St.to-St.from));STW[i]=w;h=Math.round(e*lh+(Math.floor(e)*lh-e*lh)*w)}lift[i]=h;if(h>top)top=h}
    const T=top+8,CH=H+T,cv=document.createElement('canvas');cv.width=W;cv.height=CH;const g=cv.getContext('2d'),img=g.createImageData(W,CH),D=img.data,dep=new Int16Array(W*CH).fill(-1);
    const put=(x,y,c,wy)=>{if(y<0||y>=CH)return;const o=(y*W+x)*4;D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=255;dep[y*W+x]=wy};
    // (a tone by patches a few px across, a little grain within)
    const pick=(L3,x,y,sd)=>L3[Math.min(L3.length-1,Math.floor((vn(x/5,y/5,sd)*.8+hsh(x,y,sd+1)*.2)*L3.length))];
    // water's colour by its depth (shallow, then deeper, then deep), the bed (bed) showing through it while it is shallow, and the
    // light caught in the shallows
    // (S: its colours by depth, the sea's or a river's; clear: how deep its bed still shows (a river's murkier than the sea))
    const underWater=(x,y,i,bed,S=COL.shallow,clear=LAB.depth.clear)=>{const d=L.DP[i];let c=d<.4?mix(S[0],S[1],d/.4):d<1?mix(S[1],S[2],(d-.4)/.6):mix(S[2],S[3],Math.min(1,(d-1)));
      const a=Math.pow(Math.max(0,1-d/clear),1.4);c=mix(c,bed,a*.8);if(a>.15&&vn(x/3,y/3,s+93)>.74)c=mix(c,[232,246,246],.22*a);return c};
    /* a dirt road as it is worn: its side of the middle (sd: signed px), two wheel tracks (light, packed) wandering a little, a
       dark groove down each; between them the crown, a little higher, grass in tufts on it where the road is flat; outside them
       loose ground and gravel; at its edge the grass creeping in, dithered, a dark line of trodden soil inside it; puddles lying
       in the tracks where it is flat */
    const RCOL={pack:[[176,148,104],[168,140,98]],groove:[118,94,66],crown:[[150,124,86],[142,116,80]],loose:[[136,110,76],[126,102,70],[146,120,84]],
      gravel:[[178,170,154],[150,144,130],[118,112,102]],soil:[96,78,54],sky:[170,196,210]};
    const roadCol=(x,y,i,n)=>{const RR=LAB.road,Rd=L.road,f=Rd.I[i],j=Math.min(Rd.pts.length-2,Math.floor(f)),a=Rd.pts[j],b=Rd.pts[j+1],t=f*2,
        side=Math.sign((b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]))||1,sd=Rd.D[i]*side,hw=L.HW[i],dr=L.RD[i],flat=L.G[i]<.015,
        rk=hw*RR.track+(vn(t/40,.5,s+98)-.5)*2*RR.wander,tr=Math.min(Math.abs(sd-rk),Math.abs(sd+rk));
      let c;
      if(tr<.7)c=RCOL.groove;
      else if(tr<2.2)c=RCOL.pack[vn(x/4,y/4,s+99)>.5?0:1];
      else if(Math.abs(sd)<rk){c=RCOL.crown[vn(x/5,y/5,s+100)>.5?0:1];if(flat&&vn(x/4,y/4,s+101)>.58)c=mix(c,COL.grass[n<.5?1:2],.7)}
      else{c=RCOL.loose[Math.floor(vn(x/3,y/3,s+102)*2.99)];if(hsh(x,y,s+103)<RR.gravel)c=RCOL.gravel[Math.floor(hsh(x,y,s+104)*3)]}
      // (puddles: in the tracks where the road is flat, the sky in them, a dark rim)
      if(flat&&tr<2.6&&fbm(x/14,y/14,s+74,2)>RR.puddle){const q=fbm(x/14,y/14,s+74,2)-RR.puddle;c=q<.02?RCOL.soil:mix(mix(COL.puddle[0],RCOL.soil,.4),RCOL.sky,hsh(x>>1,y,s+75)<.15?.45:.1)}
      // (the verge: the grass creeping in, dithered, the trodden soil inside it)
      const v=dr-(hw-3.5);if(v>0){if(hsh(x,y,s+105)<v/3.5*.9+(vn(x/3,y/3,s+106)-.5)*.5)c=COL.grass[hsh(x,y,s+107)<.5?1:2];else if(v<1.2)c=mix(c,RCOL.soil,.5)}
      return c};
    // the biomes blended: each px's ground's plain colour (its palette's middle), averaged over blend.r px round it among the grounds
    // that blend (not water, roads, bridges), sampled through a warp so the edge is ragged; a px's colour shifts by the difference
    const KB=[],mean=L3=>[0,1,2].map(j=>L3.reduce((a,c)=>a+c[j],0)/L3.length),BLEND=new Uint8Array(32);
    KB[K.wet]=mean(COL.wet);KB[K.sand]=mean(COL.sand);KB[K.dune]=mix(mean(COL.sand),COL.dune[0],.45);KB[K.grass]=mean(COL.grass);KB[K.meadow]=mean(COL.meadow);KB[K.wood]=mean(COL.wood);
    KB[K.scree]=mean(COL.scree);KB[K.rock]=mean(COL.rock.slice(0,3));KB[K.snow]=mean(COL.snow);KB[K.bank]=mix(mean(COL.mud),mean(COL.grass),.5);KB[K.cut]=mix(mean(COL.bank),mean(COL.grass),.5);
    KB[K.oasis]=mean(COL.oasis);
    for(const k of [K.wet,K.sand,K.dune,K.grass,K.meadow,K.wood,K.scree,K.rock,K.snow,K.bank,K.oasis])BLEND[k]=1;
    const BR=new Float32Array(W*H),BG=new Float32Array(W*H),BB=new Float32Array(W*H),BM=new Float32Array(W*H);
    for(let i=0;i<W*H;i++){const k=KD[i];if(!BLEND[k])continue;const c=KB[k];BR[i]=c[0];BG[i]=c[1];BB[i]=c[2];BM[i]=1}
    {const r=LAB.blend.r,tmp=new Float32Array(Math.max(W,H));
      const box=(A,len,stride,start)=>{let acc=0;for(let k=-r;k<=r;k++){const q=Math.min(len-1,Math.max(0,k));acc+=A[start+q*stride]}
        for(let k=0;k<len;k++){tmp[k]=acc;const o=Math.max(0,k-r),p=Math.min(len-1,k+r+1);acc+=A[start+p*stride]-A[start+o*stride]}for(let k=0;k<len;k++)A[start+k*stride]=tmp[k]};
      for(const A of [BR,BG,BB,BM])for(let pass=0;pass<2;pass++){for(let y=0;y<H;y++)box(A,W,1,y*W);for(let x=0;x<W;x++)box(A,H,W,x)}}
    const blendAt=(x,y,k,c)=>{const B=LAB.blend,wx=Math.min(W-1,Math.max(0,Math.round(x+(vn(x/12,y/12,s+108)-.5)*B.warp))),wy=Math.min(H-1,Math.max(0,Math.round(y+(vn(x/12+9,y/12,s+109)-.5)*B.warp))),j=wy*W+wx,m=BM[j];
      if(!m)return c;const o=KB[k];return [c[0]+(BR[j]/m-o[0])*B.k,c[1]+(BG[j]/m-o[1])*B.k,c[2]+(BB[j]/m-o[2])*B.k]};
    // a px's top colour
    const topCol=(x,y,i)=>{const k=KD[i],e=E[i],n=hsh(x,y,s+5);let c;
      switch(k){
        case K.water:{c=underWater(x,y,i,COL.seabed[Math.sin(x*.35+y*.12+vn(x/12,y/12,s+90)*6)>.55?0:1]);if(L.river.PL[i]>0){const rc=underWater(x,y,i,COL.seabed[1],COL.riverwater,LAB.depth.riverClear);c=mix(c,rc,Math.min(1,L.river.PL[i]/LAB.river.plume*(.75+.5*vn(x/9,y/9,s+134))))}if(n<.006&&L.DP[i]>.5)c=mix(c,COL.foam,.4);break}
        case K.wet:c=pick(COL.wet,x,y,s+6);break;case K.sand:c=pick(COL.sand,x,y,s+7);break;
        case K.dune:c=mix(pick(COL.sand,x,y,s+8),COL.dune[n<.5?0:1],.45);break;
        case K.road:c=roadCol(x,y,i,n);break;
        case K.bridge:{
          // (planks across the deck, each its own tone and a thin dark gap between them, the wheels' wear down it; a rail each
          //  side, lit on top, on a post every 8 px)
          const RR=LAB.road,d=L.road.D[i],t=L.road.I[i]*2,hw=L.bridge.hw,pl=Math.floor(t/4);c=COL.plank[Math.floor(hsh(pl,7,s+77)*3)];if(t%4<.55)c=mul(COL.plank[1],.72);
          if(Math.abs(d-hw*RR.track)<1.3)c=mul(c,.92);if(hsh(pl,Math.floor(d),s+78)<.04)c=mul(c,.85);
          if(d>hw-2.2)c=t%8<1.6?COL.beam[0]:d>hw-1.1?mul(COL.plank[2],1.08):COL.plank[1];break}
        case K.river:{const tarn=L.river.RW[i]>50;c=tarn?underWater(x,y,i,COL.tarnbed[hsh(x>>1,y>>1,s+78)<.5?0:1]):underWater(x,y,i,COL.pebble[Math.floor(hsh(x>>1,y>>1,s+91)*4)],COL.riverwater,LAB.depth.riverClear);if(!tarn&&n<.004)c=COL.stone[1];break}
        case K.ford:c=underWater(x,y,i,COL.pebble[Math.floor(hsh(x>>1,y>>1,s+92)*4)],COL.riverwater,LAB.depth.riverClear);if(hsh(x>>1,y>>1,s+79)<.12)c=COL.stone[hsh(x,y,s+80)<.5?0:1];break;
        case K.cut:{
          // (earth showing as the bank steepens, gradually and in ragged patches; lighter and warmer up its sunlit upper part, darker
          //  at its foot; tufts regrowing on it, the fewer the steeper; the grass of its lip hanging over)
          const C=LAB.cut,t=smooth((L.G[i]-C.from)/(C.to-C.from)+(vn(x/6,y/6,s+110)-.5)*C.rag),up=smooth((L.road.D[i]-L.HW[i])/LAB.road.sh),q=vn(x/3,y/3,s+111)*.55+hsh(x,y,s+112)*.45;
          if(q<t*C.earth){const E1=mix(COL.bank[2],COL.bank[0],.35+.65*up);c=mix(E1,C.lit,up*.35*vn(x/5,y/4,s+113));if(hsh(x,y,s+114)<.03)c=mix(c,COL.stone[1],.6)}
          else c=pick(COL.grass,x,y,s+115);
          if(q>=t*C.earth&&q<t*C.earth+.06)c=mul(c,.82);break}
        case K.bank:c=mix(pick(COL.mud,x,y,s+81),COL.grass[0],L.river.RW[i]>50?.5:Math.min(1,Math.max(0,(L.river.D[i]-L.river.RW[i])/4)));break;
        case K.scree:c=mix(pick(COL.scree,x,y,s+10),COL.grass[0],hsh(x>>2,y>>2,s+11)<.3?.4:0);break;
        case K.rock:{c=pick(COL.rock.slice(0,3),x,y,s+12);const gp=smooth((vn(x/14,y/14,s+13)-.56)/.12+(hsh(x,y,s+14)-.5)*.6);if(gp>0)c=mix(c,COL.grass[0],.55*gp);break}
        case K.snow:c=pick(COL.snow,x,y,s+14);break;
        case K.wood:c=pick(COL.wood,x,y,s+15);break;
        case K.meadow:c=pick(COL.meadow,x,y,s+16);break;
        case K.oasis:c=pick(COL.oasis,x,y,s+162);break;
        // (a pool: still, murky water, duckweed on it in patches; ice: pale, cracked, dusted with snow)
        case K.pool:{c=underWater(x,y,i,COL.poolbed[n<.5?0:1],COL.pool,LAB.depth.riverClear);if(vn(x/18,y/3,s+163)>.68)c=mix(c,[184,204,206],.28);
          if(vn(x/6,y/6,s+157)>.78&&hsh(x,y,s+158)<.55)c=mix(c,[110,140,62],.65);if(KD[i-1]!==K.pool||KD[i+1]!==K.pool||KD[i-W]!==K.pool||KD[i+W]!==K.pool)c=mix(c,[56,48,32],.6);break}
        case K.ice:{c=pick(COL.ice,x,y,s+159);const cr=Math.abs(vn(x/10,y/10,s+160)-.5);if(cr<.018)c=mul(c,.86);else if(hsh(x>>2,y>>2,s+161)<.06)c=mix(c,[250,252,255],.6);break}
        default:c=pick(COL.grass,x,y,s+17)}
      // (the climate's own grain: the desert's ripples in its sand and cracks in its clay; the tundra's snow in patches; the bog's wet shine)
      const cl=LAB.climate;
      if(cl==='desert'){if(k===K.grass||k===K.dune)c=mul(c,1+.05*Math.sin(x*.3+y*.85+vn(x/20,y/20,s+151)*7));else if(k===K.meadow&&(Math.abs(vn(x/6,y/6,s+152)-.5)<.03||Math.abs(vn(x/6+40,y/6,s+153)-.5)<.03))c=mul(c,.78)}
      else if(cl==='frost'&&k===K.grass&&fbm(x/26,y/26,s+154,2)>.56)c=pick(COL.meadow,x,y,s+155);
      else if(cl==='swamp'){if(k===K.meadow&&vn(x/5,y/5,s+156)>.72)c=mix(c,[120,136,130],.35);
        if(k!==K.pool&&k!==K.water&&x>2&&y>2&&x<W-3&&y<H-3&&(KD[i+2]===K.pool||KD[i-2]===K.pool||KD[i+2*W]===K.pool||KD[i-2*W]===K.pool))c=mix(c,COL.mud[1],.55)}
      if(BLEND[k])c=blendAt(x,y,k,c);
      // (higher land a little cooler and darker; the smooth ground lit from the west by its slope)
      if(k>=K.grass&&k<=K.wood)c=mix(c,LAB.cool,Math.min(.35,Math.max(0,e-3)*.04));
      if((SM[i]||STW[i]<.5)&&k!==K.water){const sl=(L.GX[i]*-1+L.GY[i]*-.6)*lh*.55;c=mul(c,1+Math.max(-.16,Math.min(.12,sl)))}
      return c};
    for(let x=0;x<W;x++){
      for(let y=0;y<H;y++){const i=y*W+x,h=lift[i],sy=y-h+T,k=KD[i];let c=topCol(x,y,i);
        // (the lip: a step's edge lit; the foot of a face in its shade)
        const hs=y+1<H?lift[i+W]:0,hn=y>0?lift[i-W]:h;
        const wet=k===K.river||k===K.ford;
        if(L.BR[i]===1)c=mul(c,.62);else if(y>2&&(L.BR[i-W]===1||L.BR[i-2*W]===1||L.BR[i-3*W]===1))c=mul(c,.8);
        if(hs<h-1&&k!==K.water&&!wet)c=mul(c,1.12);if(wet&&hn>h+1)c=mix(c,COL.foam,.75);else if(wet&&y>1&&lift[i-2*W]>h+1)c=mix(c,COL.foam,.4);else if(hn>h+1)c=mul(c,.78);else if(y>1&&lift[i-2*W]>h+1)c=mul(c,.9);
        // (a stone parapet along the road's edge where the ground beyond it drops wall levels or more)
        if(k===K.road&&L.RD[i]>L.HW[i]-2.2){let lo=h;for(const [a,b] of [[4,0],[-4,0],[0,4],[0,-4]]){const xx=x+a,yy=y+b;if(xx>=0&&yy>=0&&xx<W&&yy<H)lo=Math.min(lo,lift[yy*W+xx])}if(lo<=h-LAB.road.wall*lh)c=COL.stone[(x+y)%5===0?2:hsh(x,y,s+82)<.5?0:1]}
        put(x,sy,c,y);
        // the south face, down to where the next px's top starts
        const sy2=(y+1<H?y+1-hs:H-1+0)+T;if(y+1>=H){for(let r=sy+1;r<CH;r++)put(x,r,COL.face[2],y);continue}
        if(sy2>sy+1&&wet){for(let r=sy+1;r<sy2;r++){const n=hsh(x,r,s+83),q=hsh(x,0,s+84);put(x,r,r>=sy2-2?COL.foam:COL.fall[q<.35?0:q<.75?1:2],y);if(n<.02)put(x,r,COL.foam,y)}}
        else if(sy2>sy+1&&k===K.bridge){const Bg=LAB.bridge,t=L.road.I[i]*2,tp=((t%Bg.pile)+Bg.pile)%Bg.pile,n2=sy2-sy,under=mix(COL.river[2],[20,28,40],.55);
          for(let r=sy+1;r<sy2;r++){const dz=r-sy;let c2;
            if(dz===1)c2=COL.plank[2];else if(dz<=3)c2=dz===2?COL.beam[0]:mul(COL.beam[0],.8);
            else if(tp<2)c2=tp<1?COL.plank[1]:COL.beam[0];
            else if(n2>7&&(Math.abs(tp-2-(dz-4)*(Bg.pile-4)/Math.max(1,n2-5))<.8||Math.abs(Bg.pile-2-tp-(dz-4)*(Bg.pile-4)/Math.max(1,n2-5))<.8))c2=mul(COL.beam[0],.9);
            else c2=mix(under,COL.river[1],Math.max(0,(dz-n2+3)/6)*.5);
            if(r===sy2-1&&tp<2)c2=COL.foam;put(x,r,c2,y)}}
        else if(sy2>sy+1&&(SM[i]||STW[i]<.5)&&h-hs<=3){const cn=topCol(x,y+1,i+W),n2=sy2-sy,dk=SM[i]?.93:1;for(let r=sy+1;r<sy2;r++)put(x,r,mul(mix(c,cn,(r-sy)/n2),dk),y)}
        else if(sy2>sy+1&&SM[i]&&L.RD[i]<L.HW[i]+5){for(let r=sy+1;r<sy2;r++){const dz=r-sy,row=Math.floor(dz/3),off=(row&1)*3;put(x,r,dz%3===0||(x+off)%6===0?COL.stone[2]:COL.stone[hsh(Math.floor((x+off)/6),row,s+85)<.5?0:1],y)}}
        else if(sy2>sy+1){const drop=h-hs,rocky=G[i]>=LAB.cls.steep||drop>=2*lh||k===K.rock||k===K.snow||k===K.scree,sand=k<=K.dune;
          for(let r=sy+1;r<sy2;r++){const dz=r-sy,zh=h-dz,f=dz/Math.max(1,drop),n=hsh(x,r,s+20);let c2;
            if(sand)c2=mix(COL.sand[0],COL.wet[1],f*.8);
            else if(rocky){const RC=COL.rock;c2=mix(f<.5?RC[2]:RC[3],COL.face[2],.25);c2=mix(c2,RC[4],Math.min(.5,f*.5));if(zh%lh===0)c2=mul(c2,.62);else if((zh+1)%lh===0)c2=mul(RC[1],.95);if(n<.1)c2=mul(c2,.88);if(vn(x/3,r/6,s+21)>.7)c2=mul(c2,.9);
              if(k===K.snow&&(zh%lh===0||zh%lh===lh-1)&&n<.7)c2=COL.snow[1]}
            else{c2=dz===1?COL.lip:dz===2&&n<.5?COL.lip:mix(COL.bank[0],COL.bank[2],f);if(n<.06)c2=mul(c2,.85)}
            put(x,r,c2,y)}}}}
    // the small things on the ground (where its own px shows): tufts, flowers, pebbles; marram on the dunes; driftwood and shells on
    // the beach; snow's sparkle
    const vis=(x,y)=>{const sy=y-lift[y*W+x]+T;return sy>=2&&dep[sy*W+x]===y?sy:-1};
    /* the bridge, a structure standing over the land (the owner, 2026-11-15: "the bridge is draw over the terrain hence the bridge
       base or foundation should be transparent"): the land under it is the land (the river and its banks, in its shade), and only
       its parts are drawn, north to south so the nearer covers the farther, each px only over what lies behind it: the deck (planks
       across, a thin gap between, worn where the wheels go) at its height; a beam 3 px deep under every edge; on its near (south)
       edge a pile every pile px reaching down to the land or the water under it (foam at its foot), braced between, and a stone pier
       at each end; then the rails along both sides (a post every post px, a sunlit top rail, its shadow, a middle rail) */
    if(L.bridge){const Bg=LAB.bridge,S=L.bridge,BRm=L.BR,dl=Math.round(S.h*lh),lit=[204,170,120],
        putB=(x,yy,c,wy)=>{if(yy<0||yy>=CH||x<0||x>=W)return;if(dep[yy*W+x]>wy)return;put(x,yy,c,wy)},
        inB=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&BRm[y*W+x]===1;
      let x0=W,x1=0,y0=H,y1=0;for(let i=0;i<W*H;i++)if(BRm[i]===1){const x=i%W,y=(i/W)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
      const end=t=>Math.min(t-S.i0*2,S.i1*2-t);
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x;if(BRm[i]!==1)continue;const d=L.road.D[i],t=L.road.I[i]*2,sy=y-dl+T,pl=Math.floor(t/4);
        // (the deck)
        let c=COL.plank[Math.floor(hsh(pl,7,s+77)*3)];if(t%4<.55)c=mul(COL.plank[1],.72);if(Math.abs(d-S.hw*LAB.road.track)<1.3)c=mul(c,.92);if(hsh(pl,Math.floor(d),s+78)<.04)c=mul(c,.85);
        if(!inB(x,y-1))c=mul(c,1.1);putB(x,sy,c,y);
        // (the beam under its edge)
        const edge=!inB(x,y+1)||!inB(x-1,y)||!inB(x+1,y);if(edge)for(let j=1;j<=3;j++)putB(x,sy+j,j===1?COL.beam[0]:mul(COL.beam[0],.8),y);
        // (its near edge: piles to the ground, braced between; stone piers at its ends)
        if(!inB(x,y+1)){const gy=y-lift[i]+T,top=sy+4;if(gy<=top)continue;const tp=((t%Bg.pile)+Bg.pile)%Bg.pile,n2=gy-top,wet=KD[i]===K.river||KD[i]===K.water||KD[i]===K.ford,pier=false;
          for(let r=top;r<gy;r++){const dz=r-top;let c2=null;
            if(pier)c2=COL.stone[(Math.floor(r/3)+(x&1))%2?0:1];
            else if(tp<2)c2=tp<1?COL.plank[1]:COL.beam[0];
            else if(n2>5&&(Math.abs(tp-2-dz*(Bg.pile-4)/Math.max(1,n2))<.7||Math.abs(Bg.pile-2-tp-dz*(Bg.pile-4)/Math.max(1,n2))<.7))c2=mul(COL.beam[0],.9);
            if(c2)putB(x,r,c2,y)}
          if(wet&&(tp<2||pier))putB(x,gy,COL.foam,y)}}
      // (the rails)
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x;if(BRm[i]!==1)continue;const t=L.road.I[i]*2;
        const side=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const j=(y+b)*W+x+a;return !inB(x+a,y+b)&&L.road.D[j]>=S.hw-.5});if(!side||end(t)<1)continue;
        const sy=y-dl+T,post=((t%Bg.post)+Bg.post)%Bg.post<1.2;
        if(post)for(let j=1;j<=Bg.rail+1;j++)putB(x,sy-j,j===Bg.rail+1?lit:COL.beam[1],y);
        else{putB(x,sy-Bg.rail,lit,y);putB(x,sy-Bg.rail+1,COL.beam[1],y);putB(x,sy-(Bg.rail>>1),COL.plank[0],y);putB(x,sy-(Bg.rail>>1)+1,COL.beam[1],y)}}}
    /* the small things on the ground, on a layer of their own over the land (the owner, 2026-11-15: "only terrain without them,
       those will be draw by separated layer"): tufts, flowers, pebbles; marram on the dunes; driftwood and shells on the beach;
       leaf litter; reeds on the banks. Each only where its ground is seen (not under the bridge, not behind a ridge) */
    const dcv=document.createElement('canvas');dcv.width=W;dcv.height=CH;const dg=dcv.getContext('2d'),dimg=dg.createImageData(W,CH),DD=dimg.data;
    const putD=(x,yy,c)=>{if(yy<0||yy>=CH||x<0||x>=W)return;const o=(yy*W+x)*4;DD[o]=c[0];DD[o+1]=c[1];DD[o+2]=c[2];DD[o+3]=255};
    for(let y=2;y<H;y++)for(let x=1;x<W-1;x++){const i=y*W+x,k=KD[i],r=hsh(x,y,s+30);if(r>.06)continue;const sy=vis(x,y);if(sy<0)continue;
      if(k===K.grass||k===K.meadow||k===K.oasis){if(r<.03){const c=COL.tuft[r<.012?0:1];putD(x,sy-1,c);if(r<.015)putD(x,sy-2,COL.tuft[0])}else if(k===K.meadow&&r<.05)putD(x,sy-1,COL.flower[Math.floor(hsh(x,y,s+31)*4)])}
      else if(k===K.dune&&r<.05){const h=2+Math.floor(hsh(x,y,s+32)*3);for(let j=1;j<=h;j++)putD(x+(j>2&&r<.025?1:0),sy-j,COL.marram[j&1])}
      // (driftwood (the owner: the dark dashes on the sand): a few sticks along the tide line only, 3-6 px, some aslant, some forked,
      //  bleached on top, dark under, a faint shadow on the sand)
      else if((k===K.sand||k===K.wet)&&r<.0013&&L.DW[i]<20){const n=3+Math.floor(hsh(x,y,s+130)*4),sl=hsh(x,y,s+131)<.4?(hsh(x,y,s+132)<.5?-1:1):0,
          ok=(xx,yy)=>xx>0&&xx<W-1&&yy>0&&yy<CH&&dep[yy*W+xx]===y,shade=mul(COL.wet[0],.85);
        for(let j=0;j<n;j++){const xx=x+j,yy=sy-Math.floor(j*sl/3);if(!ok(xx,yy))continue;putD(xx,yy+1,shade);putD(xx,yy,j===0||j===n-1?COL.drift:[196,178,146])}
        if(hsh(x,y,s+133)<.35&&ok(x+1,sy-1))putD(x+1,sy-1,[176,156,124])}
      else if(k===K.sand&&r<.012)putD(x,sy,COL.shell,y)
      // (the woods' floor: fallen leaves in pairs, now and then a twig; pebbles lit on top, dark under)
      else if(k===K.wood&&r<.03){if(r<.003){const d=hsh(x,y,s+34)<.5?1:-1;for(let j=0;j<3;j++)putD(x+j,sy-1-(j*d>0?j>>1:0),j===1?[104,74,46]:[84,60,38])}
        else if(r<.012){const c=COL.litter[Math.floor(hsh(x,y,s+35)*3)];putD(x,sy-1,c);putD(x+1,sy-1,mul(c,.8))}else putD(x,sy-1,COL.tuft[2])}
      else if((k===K.scree||k===K.rock)&&r<.03){putD(x,sy,COL.scree[1]);if(r<.015){putD(x,sy-1,COL.scree[0]);putD(x+1,sy,mul(COL.scree[1],.8))}}
      else if(k===K.bank&&r<.05){const h=3+Math.floor(hsh(x,y,s+86)*3);for(let j=1;j<=h;j++)putD(x,sy-j,j===h&&r<.02?COL.reed[2]:COL.reed[j&1])}}
    dg.putImageData(dimg,0,0);
    g.putImageData(img,0,0);
    // the shore's px (the foam rides them): water beside land, on the screen
    const shore=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(KD[i]!==K.water)continue;if(KD[i-1]||KD[i+1]||KD[i-W]||KD[i+W])shore.push(x,y+T,hsh(x,y,s+40)*6.283)}
    // the river's moving water: each surface px seen (x, screen y, px along, a phase) and each fall's px (flagged by a negative)
    const flow=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,k=KD[i];if(k!==K.river&&k!==K.ford&&!(k===K.water&&L.river.RV[i]===1&&L.river.PL[i]>.2))continue;if(L.river.RW[i]>50)continue;const sy=vis(x,y);if(sy<0)continue;
      flow.push(x,sy,L.river.RT[i],hsh(x,y,s+87));const hs=lift[i+W],sy2=y+1-hs+T;for(let r=sy+1;r<sy2-2;r++)if(dep[r*W+x]===y)flow.push(x,r,-1,hsh(x,0,s+88)*20)}
    // the walk map: each px's class as a tint
    const wm=document.createElement('canvas');wm.width=W;wm.height=CH;{const wg=wm.getContext('2d'),wi=wg.createImageData(W,CH),WD=wi.data;
      for(let y=0;y<CH;y++)for(let x=0;x<W;x++){const wy=dep[y*W+x];if(wy<0)continue;const i=wy*W+x,c=classAt(L,i),b=bandAt(L,i),o=(y*W+x)*4,col=b?[0,[120,230,240],[90,200,240],[60,140,240],[40,50,200]][b]:[[60,120,255],[60,200,80],[230,210,60],[240,130,40],[230,40,40]][c];WD[o]=col[0];WD[o+1]=col[1];WD[o+2]=col[2];WD[o+3]=110}
      wg.putImageData(wi,0,0)}
    return {cv,decor:dcv,dep,lift,T,CH,shore,flow,wm,ms:performance.now()-t0}}

  // a px's walk class: 0 water, 1 flat, 2 slope, 3 steep, 4 cliff (the road always flat: its grade is held)
  // (water: its depth band (1 ankle, 2 knee, 3 waist, 4 swimming), 0 dry)
  function bandAt(L,i){if(L.BR[i]===1)return 0;const d=L.DP[i];if(!(d>0))return 0;const B=LAB.depth.bands;return d<B[0]?1:d<B[1]?2:d<B[2]?3:4}
  // (water: knee-deep or less walks as a slope, waist-deep as steep, deeper is 0: swimming)
  function classAt(L,i){if(L.BR[i]===1)return 1;const b=bandAt(L,i);if(b)return b<=2?2:b===3?3:0;const k=L.KD[i];if(k===K.road||k===K.bridge)return 1;const g=L.G[i],C=LAB.cls;return g>=C.cliff?4:g>=C.steep?3:g>=C.slope?2:1}
  // how fast a man goes at px i heading (dx, dy) (a unit vector), times the walk; 0 he cannot. climber: a cliff is slow, not shut
  // (heavy: in heavy armour, so he cannot swim; nor can a man with no stamina left)
  function speedAt(L,i,dx,dy,climber,sta,heavy){const S=LAB.speed,k=L.KD[i],b=bandAt(L,i);if(L.BR[i]===1)return S.road;if(b)return b===4&&(heavy||sta<=0)?0:LAB.depth.speed[b];const c=classAt(L,i);if(k===K.bridge)return S.road;
    let m=k===K.road?S.road:k===K.sand||k===K.wet?S.sand:k===K.dune?S.dune:k===K.snow?S.snow:k===K.wood?S.wood:k===K.meadow?S.meadow:k===K.grass?S.grass:k===K.ice?S.ice:S.flat;
    const up=(dx*L.GX[i]+dy*L.GY[i])>0;
    if(c===2)m*=up?S.up:S.down;else if(c===3)m*=S.steep;else if(c===4){if(!climber||sta<=0)return 0;m*=S.cliff}
    return m}

  // small things of the land's own, drawn px by px and cached (the owner, 2026-11-15: "improve boulders, tree stumps, logs and other
  // map details"): all lit from the upper left, with shaded rims (no black outline, as on the world map), a soft shadow under each
  const NAT={},nat=(k,f)=>NAT[k]||(NAT[k]=f());
  // (a picture made px by px: set(x, y, colour, alpha) lays a colour over what is there; has(x, y): whether a px is painted solid)
  function pixPic(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),im=g.createImageData(w,h),D=im.data;
    const set=(x,y,col,a)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=w||y>=h)return;const o=(y*w+x)*4;if(a===undefined||a>=1){D[o]=col[0];D[o+1]=col[1];D[o+2]=col[2];D[o+3]=255;return}
        const b=D[o+3]/255,na=a+b*(1-a);for(let k=0;k<3;k++)D[o+k]=(col[k]*a+D[o+k]*b*(1-a))/na;D[o+3]=na*255},
      has=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&D[(y*w+x)*4+3]===255;
    draw(set,has);
    // (snow lying on it: the top px or two of each column white, its shade blue-grey)
    if(CAP)for(let x=0;x<w;x++)for(let y=0;y<h;y++){if(D[(y*w+x)*4+3]!==255)continue;const n=1+(hsh(x,y,w*7+h)<.5?1:0);
      for(let k=0;k<n&&y+k<h;k++){const q=((y+k)*w+x)*4;if(D[q+3]!==255)break;const cc=k?[204,214,228]:[242,246,252];D[q]=cc[0];D[q+1]=cc[1];D[q+2]=cc[2]}break}
    g.putImageData(im,0,0);return c}
  let CAP=false;
  // (a tone of a ramp (darkest first) by light l, -1 to 1; a soft shadow, an ellipse)
  const ramp=(R,l)=>R[Math.max(0,Math.min(R.length-1,Math.floor((l+1)*.5*R.length)))];
  const shade=(set,cx,cy,rx,ry,a)=>{for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++){const d=((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2;if(d<=1)set(x,y,[18,24,14],a*(1-d*.6))}};
  const ROCK=[[56,58,60],[80,82,82],[106,106,102],[132,130,122],[158,154,142],[186,182,166]],MOSS=[[54,80,36],[74,104,44],[98,128,56],[124,150,70]],
    BARK=[[48,34,24],[68,48,32],[90,64,42],[114,84,56],[140,106,72]],WOOD=[[146,108,66],[180,144,96],[212,182,130]],
    LEAF={dry:[[78,72,40],[104,96,52],[132,120,66],[160,146,84],[188,172,108]],oak:[[30,54,26],[44,76,34],[62,100,42],[86,126,54],[118,154,72]],birch:[[48,70,28],[70,96,38],[96,124,50],[126,152,66],[164,184,90]],dark:[[20,42,26],[30,58,34],[42,76,42],[58,96,52],[84,122,66]]},
    FERN=[[36,66,30],[54,94,38],[80,124,50],[112,156,68]];
  // a rock: lumps ([x, y, rx, ry], y its middle) of one height field, sunk in the ground at row base; dark seams where two lumps meet,
  // a lit rim up and left and a shaded one down and right, moss on the tops (moss: how much), lichen, a tuft at its foot now and then
  const ROCKS={grey:ROCK,sand:[[110,62,40],[140,84,54],[170,110,72],[196,138,94],[218,166,118],[236,196,150]],cold:[[60,64,72],[84,90,98],[110,116,124],[138,144,150],[166,172,178],[196,200,206]]};
  function rockPic(w,h,base,lumps,v,moss){const ROCK=ROCKS[LAB.look.rock]||ROCKS.grey;return pixPic(w,h,(set,has)=>{
    let x0=w,x1=0;for(const [cx,,rx] of lumps){x0=Math.min(x0,cx-rx);x1=Math.max(x1,cx+rx)}shade(set,(x0+x1)/2+1,base+.6,(x1-x0)/2+1,1.8,.4);
    const Z=new Float32Array(w*h),S=new Uint8Array(w*h);
    for(let y=0;y<=base;y++)for(let x=0;x<w;x++){let a=0,b=0;for(const [cx,cy,rx,ry] of lumps){const d=1-((x+.5-cx)/rx)**2-((y+.5-cy)/ry)**2;if(d>0){const z=Math.sqrt(d)*Math.min(rx,ry);if(z>a){b=a;a=z}else if(z>b)b=z}}
      Z[y*w+x]=a;S[y*w+x]=b>.3&&a-b<.5?1:0}
    const z=(x,y)=>x<0||y<0||x>=w||y>base?0:Z[y*w+x],in_=(x,y)=>z(x,y)>0;
    // (moss and the top's light keep to the top of each column: within top px of its first)
    const top=new Int16Array(w).fill(99);for(let x=0;x<w;x++)for(let y=0;y<=base;y++)if(in_(x,y)){top[x]=y;break}
    for(let y=0;y<=base;y++)for(let x=0;x<w;x++){if(!in_(x,y))continue;const gx=z(x+1,y)-z(x-1,y),gy=z(x,y+1)-z(x,y-1),up=y-top[x];
      let l=(gx*.6+gy*.75)*.55+(up<2?.4:0)-(up/(base-top[x]+1))*.85+.3+(hsh(x>>1,y>>1,v+5)-.5)*.35+(hsh(x,y,v+6)-.5)*.15;
      if(y>=base-1)l-=.35;if(S[y*w+x])l-=.7;if(!in_(x+1,y)||!in_(x,y+1))l-=.45;else if(!in_(x-1,y)||!in_(x,y-1))l+=.3;
      let col=ramp(ROCK,Math.max(-1,Math.min(.99,l)));
      if(moss&&up<2+moss*2&&vn(x/3.5,y/3.5,v+7)>.6-moss*.2)col=ramp(MOSS,l*.8);else if(hsh(x,y,v+8)<.025&&l>-.2)col=[178,172,120];
      set(x,y,col)}
    if(v&1)for(let k=0;k<2;k++){const tx=Math.round(x0+1+hsh(v,k,9)*(x1-x0-2));for(let j=0;j<2+(k^v&1);j++)set(tx+(j>1?k*2-1:0),base-j,FERN[j?2:1])}})}
  // a boulder (s px across, by v: round, heaped, tall or a flat slab)
  function boulderPic(v,s,moss){return nat('b'+v+'_'+s+'_'+moss,()=>{const w=s+4,hb=Math.round(s*.78),h=hb+4,base=h-3,L=[],f=v%5;
    const mx=f===3?s*.34:f===4?s*.48:s*.42,my=f===3?hb*.56:f===4?hb*.32:hb*.5;L.push([w/2,base-my*.82,mx,my]);
    const n=f===4?1:1+v%3;for(let j=1;j<=n;j++){const rx=s*(.17+hsh(v,j,91)*.13),ry=rx*(.7+hsh(v,j,92)*.45),side=(j+v)%2?-1:1;
      const cx=w/2+side*Math.max(0,Math.min(s*.32,s/2-rx)*(.5+hsh(v,j,93)*.5)),cy=Math.max(ry+1,base-ry*.75-hsh(v,j,94)*Math.max(0,hb-ry*1.9));L.push([cx,cy,rx,ry])}
    return {img:rockPic(w,h,base,L,v,moss),ax:w>>1,ay:base}})}
  // a stone (n px across): one, or (now and then) two or three together
  function stonePic(n,v){return nat('s'+n+'_'+v,()=>{const mo=LAB.look.moss;const w=n+5,hb=Math.max(2,Math.ceil(n*.7)),h=hb+3,base=h-2,L=[];
    if(v%4===0&&n>3){const r=n*.3;L.push([2+r,base-r*.5,r,r*.75],[w-2-r*.8,base-r*.4,r*.8,r*.6]);if(v&4)L.push([w/2,base-r*.3,r*.55,r*.45])}
    else{L.push([w/2,base-hb*.42,n/2,hb*.5]);if(v&2)L.push([w/2+n*.35,base-hb*.2,n*.25,hb*.25])}
    return {img:rockPic(w,h,base,L,v,v%3===0?.5*mo:0),ax:w>>1,ay:base}})}
  // a fallen log (n px long; by v: lying straight or aslant, 4 or 5 px thick): bark round its length (lit on top, dark under, streaks
  // along it, cracks across), its east end a sawn face with rings; its west end sawn, broken or a plate of roots; a branch stub, moss
  // on its top, fungi on its side now and then
  function logPic(n,v){return nat('l'+n+'_'+v,()=>{const d=4+(v&1),sl=[0,.2,-.2,.36,-.36,0,.1,-.1][v%8],rise=Math.ceil(Math.abs(sl)*n),w=n+7,h=d+rise+6,y0=3+(sl<0?rise:0),ox=3,end=(v>>1)%4;
    let ay=0;const img=pixPic(w,h,(set,has)=>{
      for(let t=-1;t<=n;t++){const yc=Math.round(y0+t*sl);set(ox+t+1,yc+d,[18,24,14],.38);set(ox+t+1,yc+d+1,[18,24,14],.16)}
      // (the root plate, behind its west end)
      if(end===1){const yc=Math.round(y0);for(let y=yc-3;y<=yc+d+1;y++)for(let x=ox-3;x<=ox;x++){const e=((x-ox+1.2)/2.4)**2+((y-yc-d/2+.5)/(d/2+2.2))**2;if(e>1)continue;
        set(x,y,hsh(x,y,v+11)<.3?[96,72,48]:ramp(BARK,(x-ox)*.25-(y-yc)*.08+(hsh(x,y,v+12)-.5)*.5))}}
      for(let t=0;t<n;t++){const x=ox+t,yc=Math.round(y0+t*sl);let lo=0,hi=d-1;
        if(end===2&&t<3){if(hsh(t,1,v+13)<.6)lo+=1;if(hsh(t,2,v+13)<.5)hi-=1;if(t===0){lo++;hi--}}
        for(let j=lo;j<=hi;j++){const f=j/(d-1);let l=.75-1.6*f+(hsh(t,j,v+14)-.5)*.25;
          if(hsh(Math.floor((t+j*2)/3),j,v+15)<.28)l-=.45;if(j>0&&j<d-1&&hsh(t,0,v+16)<.05)l-=.6;if(j===lo&&t>0)l+=.2;
          let col=ramp(BARK,Math.max(-1,Math.min(.99,l)));if(f<.45&&v%3!==1&&vn(t/4,j,v+17)>.6)col=ramp(MOSS,l*.7);
          if(end===2&&t<3&&(j===lo||j===hi))col=WOOD[1+(t&1)];set(x,yc+j,col)}}
      // (its sawn east end: a face of rings, bark round it)
      {const x=ox+n,yc=Math.round(y0+(n-1)*sl),m=(d-1)/2;for(let j=0;j<d;j++){const r=Math.abs(j-m)/(m+.5);set(x,yc+j,r>.8?BARK[3]:r<.25?WOOD[0]:WOOD[2-((Math.floor(r*3))&1)]);if(j>0&&j<d-1)set(x+1,yc+j,BARK[1])}}
      if(end===0){const yc=Math.round(y0);for(let j=1;j<d-1;j++)set(ox-1,yc+j,WOOD[1])}
      // (a branch stub up from its top; bracket fungi on its side)
      if(hsh(n,v,18)<.65){const t=2+Math.floor(hsh(n,v,19)*(n-5)),yc=Math.round(y0+t*sl);set(ox+t,yc-1,BARK[3]);set(ox+t+1,yc-2,BARK[3]);if(v&2)set(ox+t+2,yc-3,BARK[2])}
      if(v%3===0)for(let k=0;k<2;k++){const t=1+Math.floor(hsh(k,v,20)*(n-3)),yc=Math.round(y0+t*sl)+d-2;set(ox+t,yc,[226,206,156]);set(ox+t+1,yc,[196,164,112]);set(ox+t,yc+1,[150,120,80])}
      ay=Math.round(y0+(n>>1)*sl)+d-1});
    return {img,ax:ox+(n>>1),ay}})}
  // a stump: a short trunk (lit west, dark east, grooved bark), flaring into roots at its foot; its top sawn (rings, a crack, its
  // heart) or broken off in splinters; moss on it, or mushrooms at its foot, now and then
  function stumpPic(v){return nat('t'+v,()=>{const w=15,h=15,base=h-3,cx=7.5,rx=3+(v&1)*.6,th=3+v%3,broken=v%3===2,ry=1.6,cyT=base-th-1;
    const img=pixPic(w,h,(set,has)=>{shade(set,cx+1.5,base+.6,rx+3.5,1.8,.4);
      // (roots: west and east along the ground, one toward you)
      for(const [dx,len] of [[-1,2+(v&2?1:0)],[1,3],[.35,1]]){const sx=cx+dx*rx;for(let k=0;k<=len;k++){const x=Math.round(sx+(dx>.5?k:dx<-.5?-k:k*.5)),y=base-1+Math.min(1,k>>1);set(x,y,k===len?BARK[1]:BARK[2]);if(k<len-1)set(x,y-1,BARK[3])}}
      for(let y=Math.floor(cyT);y<=base;y++){const fl=y>=base-1?1:0;for(let x=Math.floor(cx-rx-fl);x<=cx+rx+fl;x++){const dx=(x+.5-cx)/(rx+fl);if(Math.abs(dx)>1)continue;
        let top=cyT;if(broken)top=cyT-1+Math.round(hsh(x,v,21)*3)-(Math.abs(dx)<.5?1:0);if(y<top)continue;
        let l=-dx*.85+.15+(hsh(x,y,v+22)-.5)*.2;if(hsh(x,0,v+23)<.35)l-=.4;if(y===base)l-=.3;
        let col=ramp(BARK,Math.max(-1,Math.min(.99,l)));if(broken&&y===top)col=WOOD[hsh(x,y,v)<.5?2:1];else if(v&1&&dx<.2&&y>base-3&&vn(x/2,y/2,v+24)>.5)col=ramp(MOSS,l);set(x,y,col)}}
      if(!broken)for(let y=Math.floor(cyT-ry);y<=cyT+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cyT)/ry,r=Math.hypot(dx,dy);if(r>1)continue;
        set(x,y,r>.78?(dx<0&&dy<0?BARK[4]:BARK[3]):r<.22?[134,98,62]:Math.abs(dy)<.35&&dx>.3?WOOD[0]:WOOD[2-(Math.floor(r*3.4)&1)])}
      if(v%4===1){const red=v&2;for(const [mx,mh] of [[cx+rx+1.5,1],[cx+rx+3,0]]){const x=Math.round(mx);set(x,base,[226,218,200]);if(mh)set(x,base-1,[226,218,200]);const cy=base-1-mh;
        set(x-1,cy,red?[168,36,32]:[132,90,54]);set(x,cy,red?[196,52,40]:[160,114,70]);set(x+1,cy,red?[150,30,28]:[118,80,48]);set(x,cy-1,red?[220,80,64]:[184,136,88]);if(red)set(x-1,cy,[240,236,226])}}});
    return {img,ax:Math.floor(cx),ay:base}})}
  // a mass of leaves: lumps ([x, y, rx, ry]), the first the whole's own shape; lit up and left (and each lump on its own), darker
  // toward the bottom and the east, its edge ragged with leaves (rag), now and then a hole (gaps) showing the branches behind or the
  // dark inside; o.cut: the row below which nothing is drawn (the ground); o.streak: up-and-down grain (a poplar's); o.dots: [chance,
  // [two colours]] of berries, blossom or fruit
  function leafMass(set,has,B,P,v,o){o=o||{};const m=B[0],inB=(x,y)=>{if(o.cut!==undefined&&y>o.cut)return null;let best=null;for(const b of B){const d=((x+.5-b[0])/b[2])**2+((y+.5-b[1])/b[3])**2;if(d<=1&&(!best||b[1]<best[1]))best=b}return best};
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const b of B){x0=Math.min(x0,b[0]-b[2]);x1=Math.max(x1,b[0]+b[2]);y0=Math.min(y0,b[1]-b[3]);y1=Math.max(y1,b[1]+b[3])}
    for(let y=Math.floor(y0);y<=Math.ceil(y1);y++)for(let x=Math.floor(x0);x<=Math.ceil(x1);x++){const b=inB(x,y);if(!b)continue;
      const edge=!inB(x+1,y)||!inB(x-1,y)||!inB(x,y-1)||!inB(x,y+1);if(edge&&hsh(x,y,v+32)<(o.rag===undefined?.3:o.rag))continue;
      const dx=(x+.5-m[0])/m[2],dy=(y+.5-m[1])/m[3],bx=(x+.5-b[0])/b[2],by=(y+.5-b[1])/b[3];
      if(o.gaps&&!edge&&by>0&&hsh(x>>1,y>>1,v+36)<o.gaps){if(!has(x,y))set(x,y,P[0]);continue}
      let l=-(dx*.5+dy*.7)*.7-(bx*.3+by*.45)*.55+(hsh(x,y,v+33)-.5)*.55;if(o.cut!==undefined&&y>=o.cut-1)l-=.4;if(!inB(x+1,y)||!inB(x,y+1))l-=.3;
      if(o.streak)l+=(hsh(x,Math.floor(y/3),v+37)-.5)*o.streak;
      let col=ramp(P,Math.max(-1,Math.min(.99,l)));if(l>.35&&hsh(x,y,v+34)<.12)col=P[4];
      if(o.dots&&!edge&&l>-.3){const r=hsh(x,y,v+35);if(r<o.dots[0])col=o.dots[1][r<o.dots[0]*.4?0:1]}
      set(x,y,col)}}
  // a bush (pal: its leaves' tones): a dome of leafy lumps, its foot in the ground; berries or blossom on some
  function bushPic(v,pal){return nat('u'+v+pal,()=>{const s=9+(v%3)*2,w=s+4,hb=Math.round(s*.74),h=hb+4,base=h-3,P=LEAF[pal],B=[[w/2,base-hb*.45,s*.48,hb*.52]];
    const n=3+v%3;for(let j=0;j<n;j++){const a=Math.PI*(1.1+.8*j/Math.max(1,n-1))+(hsh(v,j,30)-.5)*.3,r=2.2+hsh(v,j,31)*1.4;B.push([w/2+Math.cos(a)*s*.3,base-hb*.45+Math.sin(a)*hb*.4,r,r*.9])}
    const img=pixPic(w,h,(set,has)=>{shade(set,w/2+1,base+.6,s*.5+1,1.7,.4);
      leafMass(set,has,B,P,v,{cut:base,dots:v%4===1?[.07,[[214,84,70],[170,34,40]]]:v%4===2?[.07,pal==='birch'?[[236,232,214],[236,232,214]]:[[226,164,184],[226,164,184]]]:null})});
    return {img,ax:w>>1,ay:base}})}

  // trees, the lab's own (the owner, 2026-11-15: "improve variety of trees"): each kind its own shape, bark and leaves, in three sizes
  // (young, grown, an old giant) and six variants, the variant shifting its tones a little
  const BARKS={brown:[[44,32,24],[62,46,32],[84,62,42],[106,80,54],[128,100,70]],grey:[[70,70,66],[94,94,88],[120,118,110],[146,144,134],[172,170,158]],
      red:[[74,40,28],[104,58,36],[136,80,48],[164,104,62],[190,130,80]],dead:[[66,62,56],[90,86,78],[116,110,100],[142,136,124],[168,162,148]]},
    LEAVES={oak:LEAF.oak,beech:[[34,62,28],[50,88,34],[72,114,44],[100,142,58],[136,172,80]],ash:[[44,70,32],[62,94,40],[86,120,52],[116,148,68],[150,176,92]],
      birch:LEAF.birch,alder:LEAF.dark,willow:[[56,78,34],[80,106,44],[108,134,58],[140,162,76],[176,190,104]],poplar:[[28,56,30],[42,78,38],[60,102,48],[84,128,60],[116,156,78]],
      apple:[[40,72,30],[58,98,40],[80,124,50],[108,150,64],[140,176,84]],maple:[[110,40,24],[150,62,30],[190,96,40],[222,140,56],[242,186,92]],
      gold:[[104,84,28],[146,120,38],[188,158,52],[220,194,76],[244,226,122]],fir:[[18,40,30],[26,58,40],[38,78,50],[54,100,62],[80,126,80]],
      spruce:[[18,36,38],[26,52,52],[36,70,66],[50,90,82],[74,114,102]],pine:[[22,46,32],[32,64,42],[46,86,54],[64,108,68],[92,134,88]],
      palm:[[36,70,34],[54,96,42],[76,122,52],[104,148,66],[140,174,88]],acacia:[[54,70,30],[76,94,40],[100,118,52],[130,144,70],[164,172,96]],
      bog:[[26,44,28],[38,62,36],[52,80,44],[70,100,56],[96,124,72]]},
    // (the broadleaves: crown rx, its ry by rx, trunk px below it, trunk thickness, bark, lumps, holes)
    BROAD={oak:[12,.8,7,3.4,'brown',8,.05],beech:[10,.95,8,2.6,'grey',5,.04],ash:[10,.85,9,2.4,'brown',7,.14],maple:[9,.9,7,2.4,'brown',6,.07],
      alder:[7,1.15,7,2.2,'brown',5,.06],apple:[7,.8,4,2.6,'brown',6,.05]};
  // (a trunk from its foot (x, base) up to row top, w px thick, leaning lean px a px up: lit west, grooved, flaring at its foot; a
  //  birch's white with black marks)
  function trunk(set,x,base,top,w,BK,v,lean,birch){for(let y=base;y>=top;y--){const up=base-y,cx=x+lean*up,tw=Math.max(1,Math.round(w+(up<2?2-up:0)-(up>(base-top)*.7&&w>2?1:0)));
      for(let k=0;k<tw;k++){const px=Math.round(cx-tw/2+k),f=tw>1?k/(tw-1):.4;let col;
        if(birch)col=hsh(Math.floor(y/2),k,v+81)<.2?[40,36,32]:f>.7?[168,164,150]:[228,224,210];
        else{let l=.6-f*1.4+(hsh(px,y,v+80)-.5)*.3;if(hsh(px-Math.round(cx),0,v+82)<.3)l-=.35;col=ramp(BK,Math.max(-1,Math.min(.99,l)))}
        set(px,y,col)}}}
  // (a limb, a line one or two px thick)
  function limb(set,x0,y0,x1,y1,col,t){const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)));for(let k=0;k<=n;k++){const x=x0+(x1-x0)*k/n,y=y0+(y1-y0)*k/n;set(x,y,col);if(t>1)set(x+1,y,col)}}
  function treePic(sp,v,sz,snow){return nat('T'+sp+v+'_'+sz+(snow?'s':''),()=>{const S=[.72,1,1.3][sz],tn=c=>mul(c,.93+(v%3)*.06),R=Math.round;
    // (a broadleaf: a trunk, two limbs up into it, a crown of lumps round its middle)
    if(BROAD[sp]){const [R0,asp,T0,th,bk,nb,gaps]=BROAD[sp],rx=R(R0*S),ry=R(rx*asp),tH=R(T0*S),w=2*rx+8,h=tH+2*ry+5,cx=w>>1,base=h-3,cy=base-tH-ry*.85;
      const P=LEAVES[sp==='maple'&&v&1?'gold':sp].map(tn),B=[[cx,cy,rx,ry]];
      for(let j=0;j<nb;j++){const a=j/nb*Math.PI*2+hsh(v,j,84)*.7,d=.5+hsh(v,j,85)*.18,r=rx*(.32+hsh(v,j,86)*.22);B.push([cx+Math.cos(a)*rx*d,cy+Math.sin(a)*ry*d*.85-ry*.08,r,r*asp*.95])}
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,rx*.55+2,2.2,.38);const BK=BARKS[bk];
        trunk(set,cx,base,R(cy+ry*.1),Math.max(1.6,th*Math.min(1.25,S)),BK,v,0);for(const d of [-1,1])limb(set,cx,cy+ry*.45,cx+d*rx*.5,cy-ry*.15,BK[1],th>2.5?2:1);
        leafMass(set,has,B,P,v,{gaps,dots:sp==='apple'?[.06,v%3===0?[[244,240,232],[236,184,198]]:[[204,40,36],[230,84,62]]]:null})});
      return {img,ax:cx,ay:base}}
    // (a birch: a slender white trunk, leaning a little, a light crown of small lumps up and down it, gold in autumn now and then)
    if(sp==='birch'){const tH=R((14+v%3*2)*S),rx=R(6*S+1),ry=R(rx*1.5),lean=((v%3)-1)*.08,w=2*rx+10,h=tH+ry+6,base=h-3,cx=w>>1,top=base-tH,mx=cx+lean*tH*.8;
      const P=LEAVES[v===4?'gold':'birch'].map(tn),B=[[mx,top+ry*.2,rx,ry]];for(let j=0;j<6;j++){const r=rx*(.4+hsh(v,j,87)*.2);B.push([mx+(hsh(v,j,88)-.5)*rx*1.1,top+ry*.2+(j/5-.5)*ry*1.3,r,r*1.15])}
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+2,base+.5,rx*.6+1,1.8,.35);trunk(set,cx,base,R(top+ry*.9),2,null,v,lean,true);limb(set,cx+lean*(base-top-ry*.9),top+ry*.9,mx,top-ry*.3,BARKS.dead[1],1);
        leafMass(set,has,B,P,v,{gaps:.16,rag:.42})});
      return {img,ax:cx,ay:base}}
    // (a poplar: tall and narrow, its leaves in up-and-down streaks)
    if(sp==='poplar'){const rx=R(4.5*S+.5),ry=R(15*S),tH=R(4*S),w=2*rx+6,h=tH+2*ry+5,cx=w>>1,base=h-3,cy=base-tH-ry*.92,P=LEAVES.poplar.map(tn),B=[[cx,cy,rx,ry]];
      for(let j=0;j<6;j++){B.push([cx+(hsh(v,j,89)-.5)*rx*.6,cy+(j/5-.5)*ry*1.4,rx*.72,ry*.3])}
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+2,base+.5,rx+1,1.8,.35);trunk(set,cx,base,R(cy),2,BARKS.grey,v,0);leafMass(set,has,B,P,v,{streak:.55,gaps:.04,rag:.25})});
      return {img,ax:cx,ay:base}}
    // (a willow: a thick short trunk, a round crown, strands hanging from it nearly to the ground, lighter at their tips)
    if(sp==='willow'){const rx=R(11*S),ry=R(rx*.68),tH=R(8*S),w=2*rx+8,h=tH+2*ry+5,cx=w>>1,base=h-3,cy=base-tH-ry*.7,P=LEAVES.willow.map(tn),B=[[cx,cy,rx,ry]];
      for(let j=0;j<6;j++){const a=Math.PI*(1+j/5),r=rx*(.38+hsh(v,j,90)*.15);B.push([cx+Math.cos(a)*rx*.55,cy+Math.sin(a)*ry*.45,r,r*.75])}
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,rx*.8,2.2,.38);trunk(set,cx,base,R(cy),3.2*Math.min(1.2,S),BARKS.grey,v,0);limb(set,cx,cy+ry*.4,cx-rx*.5,cy-ry*.2,BARKS.grey[1],2);
        leafMass(set,has,B,P,v,{gaps:.05,rag:.2});
        for(let x=Math.round(cx-rx+1);x<cx+rx;x++){if(hsh(x,0,v+91)<.35)continue;let y=Math.round(cy);while(y<base&&has(x,y+1))y++;if(y<=cy)continue;const L=Math.round((base-3-y)*(.45+hsh(x,1,v+92)*.5));
          for(let k=1;k<=L;k++){const f=k/L;set(x+(f>.6&&hsh(x,2,v+93)<.4?1:0),y+k,ramp(P,.3-f*.5+(x<cx?.25:-.25)+(hsh(x,k,v+94)-.5)*.3))}}});
      return {img,ax:cx,ay:base}}
    // (a fir or a spruce: tiers of drooping boughs from a wide skirt to a tip, lit west, dark under each; snow on their tops up high)
    if(sp==='fir'||sp==='spruce'){const Ht=R((28+v%3*4)*S),W2=R(Ht*(sp==='spruce'?.3:.36)),tH=R(3*S+1),w=2*W2+6,h=Ht+tH+5,cx=w>>1,base=h-3,top=base-tH-Ht,n=R(5+S*1.5),P=LEAVES[sp].map(tn);
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,W2*.8,2,.38);trunk(set,cx,base,base-tH-3,2,BARKS.brown,v,0);
        for(let j=n-1;j>=0;j--){const ty=top+Ht*j/n*.92,by=top+Ht*(j+1)/n+2,wb=W2*(.25+.75*(j+1)/n)+(hsh(v,j,95)-.5)*1.5;
          for(let y=Math.floor(ty);y<=by;y++){const fr=(y-ty)/Math.max(1,by-ty),half=wb*(.2+.8*fr);
            for(let x=Math.floor(cx-half);x<=cx+half;x++){const dx=(x+.5-cx)/Math.max(1,half);if(y>=by-1&&hsh(x,j,v+96)<.45)continue;
              let l=-dx*.75+(1-fr)*.35-.05-j/n*.3+(hsh(x,y,v+97)-.5)*.35;if(y>=by-1)l-=.5;if(Math.abs(dx)>.85)l-=.2;
              let col=ramp(P,Math.max(-1,Math.min(.99,l)));if(snow&&fr<.4&&dx<.5&&hsh(x,y,v+98)<.75-fr)col=dx<-.2?[238,242,248]:[204,214,228];set(x,y,col)}}}
        set(cx,top-1,P[3])});
      return {img,ax:cx,ay:base}}
    // (a pine: a tall bare trunk, red up high, limbs out to flat clouds of needles at its top)
    if(sp==='pine'){const tH=R((17+v%3*3)*S),rx=R(8*S),w=2*rx+8,h=tH+R(6*S)+6,cx=w>>1,base=h-3,top=base-tH,lean=((v%3)-1)*.07,tx=cx+lean*tH,P=LEAVES.pine.map(tn),B=[[tx,top+2,rx*.85,R(3.5*S)]];
      for(let j=0;j<3+v%2;j++){const r=rx*(.4+hsh(v,j,99)*.25);B.push([tx+(hsh(v,j,100)-.5)*rx*1.3,top+2+(hsh(v,j,101)-.6)*5*S,r,r*.45])}
      const sideY=top+R(tH*.35),side=v&1?1:-1;B.push([tx+side*rx*.55+lean*(top-sideY),sideY,rx*.45,R(2.6*S)]);
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,rx*.6,2,.35);trunk(set,cx,base,top+2,2+(S>1?1:0),BARKS.red,v,lean);
        limb(set,cx+lean*(base-sideY),sideY+2,tx+side*rx*.5+lean*(top-sideY),sideY,BARKS.red[1],1);for(const d of [-1,1])limb(set,tx,top+4,tx+d*rx*.6,top+2,BARKS.red[1],1);
        leafMass(set,has,B,P,v,{gaps:.08,rag:.35})});
      return {img,ax:cx,ay:base}}
    // (a date palm: a curving trunk ringed every two px, fronds fanning from its top and drooping, leaflets under them; dates now and then)
    if(sp==='palm'){const Ht=R((18+v%3*4)*S),Lf=R((8+v%2*2)*S),bend=((v%3)-1||1)*(.18+hsh(v,1,110)*.12)*Ht,w=2*Lf+R(Math.abs(bend))+10,h=Ht+Lf+6,base=h-3,cx=R(Lf+5+(bend<0?-bend:0)),tx=cx+bend,ty=base-Ht,P=LEAVES.palm.map(tn);
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,Lf*.7,2,.35);
        for(let k=0;k<=Ht;k++){const f=k/Ht,x=cx+bend*f*f,y=base-k,tw=f<.1?3:2;for(let j=0;j<tw;j++){let c=j===0?[176,146,100]:[128,100,66];if(k%2===0)c=mul(c,.78);set(R(x)-1+j,y,c)}}
        const n=7+v%3;for(let j=0;j<n;j++){const a=-Math.PI+j/(n-1)*Math.PI+(hsh(v,j,111)-.5)*.3,ln=Lf*(.75+hsh(v,j,112)*.35),dr=.6+hsh(v,j,113)*.4,lit=Math.cos(a)<0?.3:-.2;let lx=-99,ly=-99;
          for(let t=0;t<=1;t+=.04){const x=R(tx+Math.cos(a)*t*ln*1.15),y=R(ty+Math.sin(a)*t*ln*.6+t*t*ln*dr);if(x===lx&&y===ly)continue;lx=x;ly=y;
            set(x,y,ramp(P,lit-t*.3));if(t>.15){set(x,y+1,ramp(P,lit-.5));if(t<.85&&(R(t*20)&1))set(x,y+2,ramp(P,lit-.7))}}}
        if(v%2)for(const [dx,dy] of [[-1,2],[0,3],[1,2],[1,3]])set(R(tx)+dx,ty+dy,[150,86,40]);set(R(tx),ty-1,P[3])});
      return {img,ax:cx,ay:base}}
    // (an acacia: a thin trunk forking into limbs up to a wide flat crown)
    if(sp==='acacia'){const tH=R((9+v%3*2)*S),rx=R(11*S),ry=Math.max(2,R(3*S)),w=2*rx+8,h=tH+2*ry+6,cx=w>>1,base=h-3,cy=base-tH-ry*.3,P=LEAVES.acacia.map(tn),B=[[cx,cy,rx,ry]];
      for(let j=0;j<5;j++){const r=rx*(.3+hsh(v,j,114)*.2);B.push([cx+(j/4-.5)*rx*1.5,cy-ry*.3+(hsh(v,j,115)-.5)*2,r,r*.4])}
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,rx*.7,2,.38);const fy=base-R(tH*.55);trunk(set,cx,base,fy,2,BARKS.brown,v,0);
        for(const d of [-1,1,0])limb(set,cx,fy,cx+d*rx*.55,cy+1,BARKS.brown[2],1);leafMass(set,has,B,P,v,{gaps:.12,rag:.4})});
      return {img,ax:cx,ay:base}}
    // (a birch in winter: its white trunk, bare twigs reaching up)
    if(sp==='winterbirch'){const tH=R((16+v%3*3)*S),w=R(22*S)+4,h=tH+R(8*S)+5,cx=w>>1,base=h-3,top=base-tH,lean=((v%3)-1)*.06,TW=[[58,50,46],[84,74,66],[110,98,88]];
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+2,base+.5,4,1.6,.3);trunk(set,cx,base,top,2,null,v,lean,true);
        const br=(x,y,a,len,d,k)=>{const x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len;limb(set,x,y,x2,y2,TW[d>1?0:1+(k&1)],1);if(d>0){br(x2,y2,a-.35-hsh(v,k,116)*.25,len*.7,d-1,k*2+1);br(x2,y2,a+.3+hsh(v,k,117)*.25,len*.66,d-1,k*2+2)}};
        for(let j=0;j<4;j++){const y=top+R(tH*(.1+j*.16)),x=cx+lean*(base-y);br(x,y,-Math.PI/2+(j&1?.7:-.7)+(hsh(v,j,118)-.5)*.3,(6-j)*S,2,j+3)}});
      return {img,ax:cx,ay:base}}
    // (a swamp cypress: a flared foot with knees round it in the mud, a few flat dark clouds of needles, grey moss hanging from them)
    if(sp==='bogtree'){const tH=R((12+v%3*3)*S),rx=R(9*S),w=2*rx+12,h=tH+R(7*S)+6,cx=w>>1,base=h-3,top=base-tH,P=LEAVES.bog.map(tn),BK=BARKS.grey,B=[[cx,top+1,rx*.75,R(3.2*S)]];
      for(let j=0;j<4;j++){const r=rx*(.32+hsh(v,j,119)*.2);B.push([cx+(hsh(v,j,120)-.5)*rx*1.4,top+1+(j/3)*tH*.45,r,r*.42])}
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,rx*.8,2.2,.38);
        for(let k=0;k<4;k++){const wd=6-k;for(let j=0;j<wd;j++)set(R(cx-wd/2+j),base-k,ramp(BK,.4-(j/(wd-1))*1.2))}
        trunk(set,cx,base-3,top,2.4,BK,v,0);
        for(const [dx,dy] of [[-6,0],[5,0],[-3,1],[7,-1]])if(hsh(v,dx,121)<.7){set(cx+dx,base+dy,BK[2]);set(cx+dx,base+dy-1,BK[3])}
        for(let j=1;j<B.length;j++)limb(set,cx,B[j][1]+2,B[j][0],B[j][1],BK[1],1);
        leafMass(set,has,B,P,v,{gaps:.1,rag:.4});
        for(let x=R(cx-rx);x<cx+rx;x++){if(hsh(x,0,v+122)<.55)continue;let y=top-3;while(y<base-4&&!has(x,y))y++;while(y<base&&has(x,y+1))y++;if(y>=base-4)continue;
          const n=2+Math.floor(hsh(x,1,v+123)*5);for(let k=1;k<=n;k++)set(x,y+k,k===n?[168,176,146]:[130,140,112])}});
      return {img,ax:cx,ay:base}}
    // (a dead tree: grey, bare limbs forking twice, its top broken off)
    {const tH=R((13+v%3*3)*S),w=R(28*S),h=tH+R(13*S)+5,cx=w>>1,base=h-3,top=base-tH,BK=BARKS.dead;
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+2,base+.5,4,1.6,.35);trunk(set,cx,base,top,2.4*Math.min(1.2,S),BK,v,0);
        const br=(x,y,a,len,t,d,k)=>{const x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len;limb(set,x,y,x2,y2,BK[t>1?2:1+(k&1)],t);if(d>0){br(x2,y2,a-.42-hsh(v,k,102)*.35,len*.68,t-1,d-1,k*2+1);if(hsh(v,k,103)<.85)br(x2,y2,a+.38+hsh(v,k,104)*.35,len*.64,t-1,d-1,k*2+2)}};
        br(cx,top+2,-Math.PI/2-.5,6*S,2,2,1);br(cx,top+4,-Math.PI/2+.55,5.5*S,2,2,2);set(cx,top-1,BK[3])});
      return {img,ax:cx,ay:base}}})}
  // a bank of mist: a soft white ellipse, made once
  let MIST=null;function mistPic(){if(MIST)return MIST;const c=document.createElement('canvas');c.width=128;c.height=40;const g=c.getContext('2d');g.save();g.scale(1,40/128);
    const gr=g.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'rgba(226,234,226,.9)');gr.addColorStop(.6,'rgba(220,228,222,.4)');gr.addColorStop(1,'rgba(220,228,222,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);g.restore();return MIST=c}
  // an agave on dry ground: stiff blue-green blades from one root, now and then a tall stalk in flower
  function agavePic(v){return nat('a'+v,()=>{const st=v%4===0,w=13,h=st?20:10,base=h-2,cx=6,P=[[70,100,84],[96,128,108],[128,158,136],[164,190,168]];
    const img=pixPic(w,h,(set,has)=>{shade(set,cx+1,base+.5,4.5,1.2,.3);
      if(st){for(let k=1;k<h-4;k++)set(cx,base-k,[120,110,60]);for(const [dx,dy] of [[0,0],[-1,1],[1,1],[0,-1]])set(cx+dx,4+dy,[230,196,70])}
      const n=7+(v&1)*2;for(let j=0;j<n;j++){const a=-Math.PI*(.08+.84*j/(n-1)),Ln=3+hsh(v,j,124)*3*(1-Math.abs(j/(n-1)-.5));
        for(let t=0;t<=Ln;t+=.5)set(Math.round(cx+Math.cos(a)*t*1.2),Math.round(base+Math.sin(a)*t),ramp(P,(Math.cos(a)<0?.2:-.3)+t/Ln*.6))}});
    return {img,ax:cx,ay:base}})}
  // bones bleaching on the sand: a ribcage, a skull now and then
  function bonesPic(v){return nat('o'+v,()=>{const w=11,h=7,base=4,B=[[226,218,196],[200,190,166],[160,150,128]];
    const img=pixPic(w,h,(set,has)=>{for(let x=2;x<10;x++)set(x,base+1,B[2]);for(let j=0;j<4;j++){const x=3+j*2;set(x,base,B[1]);set(x,base-1,B[0]);set(x+1,base-2,B[0])}
      if(v&1){set(0,base,B[0]);set(1,base,B[0]);set(0,base-1,B[0]);set(1,base-1,B[1]);set(0,base+1,[90,80,70])}});
    return {img,ax:5,ay:base}})}
  // lily pads on a pool: one to three round leaves, each with its notch; a flower on some
  function lilyPic(v){return nat('y'+v,()=>{const w=12,h=6,P=[[58,98,44],[84,128,56],[118,160,74]];
    const img=pixPic(w,h,(set,has)=>{for(let j=0;j<1+v%3;j++){const cx=3+j*3+(hsh(v,j,125)-.5)*2,cy=2.5+(j&1),r=1.8+hsh(v,j,126)*1.2,nw=hsh(v,j,127)*6.28;
        for(let y=Math.floor(cy-r*.6);y<=cy+r*.6;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++){const dx=(x+.5-cx)/r,dy=(y+.5-cy)/(r*.6),d=dx*dx+dy*dy;if(d>1)continue;
          if(Math.abs(((Math.atan2(dy,dx)-nw+9.42)%6.28)-3.14)<.35)continue;set(x,y,d>.6?P[0]:dy<0?P[2]:P[1])}
        if(j===0&&v%3===1){set(Math.round(cx),Math.round(cy)-1,[236,190,206]);set(Math.round(cx)+1,Math.round(cy)-1,[246,226,236])}}});
    return {img,ax:6,ay:3}})}
  // a fern: fronds fanning up from one root, drooping at their tips, leaflets on both sides
  function fernPic(v){return nat('f'+v,()=>{const w=17,h=13,base=11,cx=8,n=5+(v&1);
    const img=pixPic(w,h,(set,has)=>{shade(set,cx+1,base+.5,5,1.4,.3);
      for(let j=0;j<n;j++){const u=j/(n-1),a=-Math.PI*(.18+.64*u)+(hsh(v,j,40)-.5)*.15,L=6+hsh(v,j,41)*2.5-Math.abs(u-.5)*2,dr=.25+Math.abs(u-.5)*1.1;let lx=-9,ly=-9;
        for(let t=0;t<=1;t+=.06){const x=Math.round(cx+Math.cos(a)*t*L*1.2),y=Math.round(base+Math.sin(a)*t*L*1.15+t*t*L*dr);if(x===lx&&y===ly)continue;lx=x;ly=y;
          set(x,y,t>.75?FERN[3]:FERN[1]);if(t>.2&&t<.85&&Math.round(t*12)%2===0){set(x,y-1,FERN[2]);set(x+(Math.cos(a)>0?1:-1),y+1,FERN[0])}}}});
    return {img,ax:cx,ay:base}})}
  // mushrooms at the woods' floor: one to three, red and spotted, brown, or pale
  function mushroomPic(v){return nat('m'+v,()=>{const w=9,h=7,base=5,k=v%3,C=[[[150,30,28],[186,44,36],[214,72,58]],[[110,74,44],[140,98,60],[172,128,82]],[[176,164,138],[204,194,168],[228,220,198]]][k];
    const img=pixPic(w,h,(set,has)=>{shade(set,4.5,base+.5,4,1.2,.3);
      for(let j=0;j<1+v%3;j++){const x=2+j*2+(j&1),sh=j?0:1,cy=base-1-sh;set(x,base,[226,218,200]);if(sh)set(x,base-1,[226,218,200]);
        set(x-1,cy,C[1]);set(x,cy,C[1]);set(x+1,cy,C[0]);if(!j){set(x,cy-1,C[2]);if(!k)set(x-1,cy,[240,236,226])}}});
    return {img,ax:4,ay:base}})}
  // a patch of flowers: stems and a few leaves, the heads one colour
  function flowersPic(v){return nat('w'+v,()=>{const w=10,h=7,base=5,C=[[236,206,80],[238,236,226],[130,146,224],[226,146,176],[170,118,196]][v%5];
    const img=pixPic(w,h,(set,has)=>{for(let j=0;j<4+v%4;j++){const x=1+Math.floor(hsh(v,j,50)*8),t=1+Math.floor(hsh(v,j,51)*2),y=base-Math.floor(hsh(v,j,52)*2);
      for(let k=0;k<t;k++)set(x,y-k,[70,112,46]);set(x,y-t,C);if(hsh(v,j,53)<.4)set(x+1,y-t,mul(C,.8));if(hsh(v,j,54)<.5)set(x-1,y,[56,94,38])}});
    return {img,ax:5,ay:base}})}
  // reeds and cattails on a bank: stems leaning a little, brown heads on some, a blade or two bent over
  function cattailPic(v){return nat('c'+v,()=>{const w=10,h=13,base=11;
    const img=pixPic(w,h,(set,has)=>{shade(set,5,base+.5,4,1.2,.3);
      for(let j=0;j<3+v%3;j++){const x0=2+Math.floor(hsh(v,j,60)*6),ht=6+Math.floor(hsh(v,j,61)*4),lean=(hsh(v,j,62)-.5)*.3,head=hsh(v,j,63)<.55;
        for(let k=0;k<ht;k++){const x=Math.round(x0+lean*k);set(x,base-k,k<2?[70,96,46]:[96,124,58])}const tx=Math.round(x0+lean*ht);
        if(head){set(tx,base-ht+1,[110,70,38]);set(tx,base-ht,[132,88,48]);set(tx,base-ht-1,[150,150,96])}else set(tx,base-ht,[160,170,96])}
      for(let j=0;j<2;j++){const x0=3+j*3,d=j?1:-1;for(let k=0;k<5;k++)set(x0+(k>2?d*(k-2):0),base-k+(k>3?1:0),[112,140,66])}});
    return {img,ax:5,ay:base}})}

  // a grass clump: a few blades from its foot, each bending lean px at its tip (the more toward the tip), dark at the foot, light at
  // the tip; a meadow's now and then flowering. Cached by kind, variant and lean
  const GRASS_PAL={grass:[[48,84,36],[78,122,50],[126,168,76]],meadow:[[54,94,40],[92,138,56],[148,184,88]],dune:[[118,126,68],[152,158,90],[194,188,118]],
    wood:[[36,64,30],[50,84,38],[70,106,48]],dry:[[146,122,66],[180,154,88],[214,190,122]],frost:[[110,114,92],[150,152,122],[214,220,214]],
    marsh:[[40,58,28],[62,84,38],[98,116,54]]},GRASS_KINDS=['grass','meadow','dune','wood','dry','frost','marsh'],GW=11,GH=10;
  // (all of them on one sheet, a row for each kind and variant, a column for each lean; and each also as its list of pixels (where, what
  //  colour), which a frame writes straight into one buffer: thousands of clumps cost one picture drawn, not thousands)
  let GATLAS=null;
  function grassAtlas(){if(GATLAS)return GATLAS;const n=LAB.grass.lean,c=document.createElement('canvas');c.width=GW*(2*n+1);c.height=GH*GRASS_KINDS.length*4;const g=c.getContext('2d');
    GRASS_KINDS.forEach((t,ti)=>{for(let v=0;v<4;v++)for(let l=-n;l<=n;l++)g.drawImage(grassSprite(t,v,l),(l+n)*GW,(ti*4+v)*GH)});
    const U=new Uint32Array(g.getImageData(0,0,c.width,c.height).data.buffer),px=[];
    for(let r=0;r<GRASS_KINDS.length*4;r++)for(let l=0;l<=2*n;l++){const D=[],C=[];for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const u=U[(r*GH+y)*c.width+l*GW+x];if(u>>>24)D.push(x,y),C.push(u)}
      px.push({D:Int8Array.from(D),C:Uint32Array.from(C)})}
    c.px=px;return GATLAS=c}
  function grassSprite(t,v,lean){const w=GW,h=GH,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),P=GRASS_PAL[t],n=3+(v&1)+(t==='meadow'?1:0);
    for(let b=0;b<n;b++){const bx=2.5+b*(5.5/n)+(hsh(v,b,150)-.5),hb=(t==='frost'?3:4)+Math.floor(hsh(v,b,151)*(t==='dune'||t==='marsh'?5:t==='frost'?3:4)),sk=(hsh(v,b,152)-.5)*1.2;
      for(let j=0;j<hb;j++){const f=j/Math.max(1,hb-1),x=Math.round(bx+(lean+sk)*Math.pow(f,1.6)),y=h-1-j;if(x<0||x>=w)continue;const col=f<.34?P[0]:f<.7?P[1]:P[2];g.fillStyle='rgb('+col.join(',')+')';g.fillRect(x,y,1,1)}
      if(t==='meadow'&&v===3&&b===1){const x=Math.round(bx+(lean+sk)),y=h-hb;g.fillStyle=['#e6d678','#dc8ca0','#ececec'][b%3];g.fillRect(x,y,1,1)}}
    return c}
  // the clumps: where each stands (sorted by y), its kind and variant, how far it is bent now by someone passing (P); only those whose
  // foot is seen (none behind a ridge, under the bridge, on the road or in water), and none just in front of a prop's foot (a strip as deep
  // as a clump is tall, as wide as the prop's lowest rows), which would stand over it: props never move, so it is trodden bare there
  function makeGrass(L,Pn,props){const W=LAB.W,H=LAB.H,s=LAB.seed,G=LAB.grass,X=[],Y=[],T=[],V=[],names=['grass','meadow','dune','wood','bank','cut','oasis'],kinds=[K.grass,K.meadow,K.dune,K.wood,K.bank,K.cut,K.oasis];
    const bare=new Uint8Array(W*H);for(const p of props){if(p.low)continue;const im=p.img;if(!im.foot){const d=im.getContext('2d').getImageData(0,Math.max(0,im.height-GH),im.width,Math.min(GH,im.height)).data;let a=im.width,b=-1;
        for(let k=3;k<d.length;k+=4)if(d[k]===255){const x=((k>>2)%im.width);if(x<a)a=x;if(x>b)b=x}im.foot=[a,b]}
      if(im.foot[1]<0)continue;const xa=p.x-p.ax+im.foot[0]-4,xb=p.x-p.ax+im.foot[1]+4;for(let y=p.y+1;y<=Math.min(H-1,p.y+GH);y++)for(let x=Math.max(0,xa);x<=Math.min(W-1,xb);x++)bare[y*W+x]=1}
    for(let gy=3;gy<H-1;gy+=G.step)for(let gx=3;gx<W-3;gx+=G.step){const x=Math.round(gx+(hsh(gx,gy,s+160)-.5)*G.step),y=Math.round(gy+(hsh(gx,gy,s+161)-.5)*G.step);if(x<1||y<1||x>=W-1||y>=H-1)continue;
      const i=y*W+x,ki=kinds.indexOf(L.KD[i]);if(ki<0||L.BR[i]||L.road.D[i]<LAB.road.w/2+2)continue;const nm=names[ki],ch=(G.chance[nm]||0)*(.35+1.3*vn(x/G.patch,y/G.patch,s+162));if(hsh(gx,gy,s+163)>ch)continue;
      if(bare[i])continue;const sy=y-Pn.lift[i]+Pn.T;if(sy<0||sy>=Pn.CH||Pn.dep[sy*W+x]!==y)continue;
      X.push(x);Y.push(y);T.push(Math.max(0,GRASS_KINDS.indexOf(G.kinds[nm]||nm)));V.push(Math.floor(hsh(gx,gy,s+164)*4))}
    const ord=X.map((_,k)=>k).sort((a,b)=>Y[a]-Y[b]);return {X:Int16Array.from(ord.map(k=>X[k])),Y:Int16Array.from(ord.map(k=>Y[k])),T:Uint8Array.from(ord.map(k=>T[k])),V:Uint8Array.from(ord.map(k=>V[k])),P:new Float32Array(ord.length),L:new Int8Array(ord.length),S:new Int16Array(ord.length),n:ord.length}}

  // the props: trees in the woods (and a few in the open), boulders on the scree, the village's houses on its shelf (models drawn on a
  // cell twice the game's: twice the detail, the same size beside a man), its people; each {x, y (its foot), img, ax, ay}
  function makeProps(L){CAP=LAB.look.snow;try{return makeProps1(L)}finally{CAP=false}}
  function makeProps1(L){const W=LAB.W,H=LAB.H,s=LAB.seed,P=[],st=LAB.woods.step,S=LAB.shelf;
    for(let gy=st;gy<H;gy+=st)for(let gx=st;gx<W;gx+=st){const x=Math.round(gx+(hsh(gx,gy,s+50)-.5)*st*.9),y=Math.round(gy+(hsh(gx,gy,s+51)-.5)*st*.9);if(x<2||y<2||x>=W-2||y>=H)continue;
      const i=y*W+x,k=L.KD[i],r=hsh(gx,gy,s+52);
      const Wd=LAB.woods,wn=k===K.wood||k===K.grass||k===K.meadow?fbm(x/Wd.sc,y/Wd.sc,s+41,3):0,edge=k===K.wood?smooth((wn-Wd.at)/Wd.fringe):smooth((wn-(Wd.at-Wd.fringe))/Wd.fringe)*.35;
      if(k===K.wood&&r<Wd.dense*(.35+.65*edge)||(k===K.grass||k===K.meadow||k===K.oasis)&&r<(k===K.oasis?.1:.025)+.6*edge&&L.road.D[i]>30&&!L.river.RV[i]&&(k===K.wood||Math.hypot((x-S.x*W)/S.rx,(y-S.y*H)/S.ry)>1.25)){const e=L.E[i],T=LAB.trees,zone=e>T.from.mountain?'mountain':e>T.from.hills?'hills':L.river.D[i]<T.near.river?'waterside':Math.hypot((x-S.x*W)/S.rx,(y-S.y*H)/S.ry)<T.near.village?'village':'lowland',mix=T[zone];
        let tot=0,sp;for(const q in mix)tot+=mix[q];let q=hsh(gx,gy,s+55)*tot;for(const k2 in mix){sp=k2;if((q-=mix[k2])<0)break}
        const v=Math.floor(hsh(gx,gy,s+53)*6),sz=k===K.wood?(edge<.5&&hsh(gx,gy,s+56)<T.young?0:hsh(gx,gy,s+57)<T.old?2:1):(hsh(gx,gy,s+56)<.4?0:1),t=treePic(sp,v,sz,e>LAB.rock+T.from.snow);
        P.push({x,y,img:t.img,ax:t.ax,ay:t.ay,kind:'tree',sp,layer:'nature'})}
      else if(k===K.scree&&r<.05&&L.road.D[i]>LAB.road.w/2+LAB.road.sh){const v=Math.floor(hsh(gx,gy,s+54)*8),b=boulderPic(v,13+(v%3)*3,0);P.push({x,y,img:b.img,ax:b.ax,ay:b.ay,kind:'rock',layer:'nature'})}}
    // (the rest of the nature layer: bushes and saplings, boulders and stones, logs and stumps, each by its ground; never on the
    //  road, the bridge, the village's shelf, or water deeper than shallow)
    {const N=LAB.nature,ns=N.step;
      for(let gy=ns;gy<H;gy+=ns)for(let gx=ns;gx<W;gx+=ns){const x=Math.round(gx+(hsh(gx,gy,s+140)-.5)*ns),y=Math.round(gy+(hsh(gx,gy,s+141)-.5)*ns);if(x<3||y<3||x>=W-3||y>=H-1)continue;
        const i=y*W+x,k=L.KD[i],r=hsh(gx,gy,s+142),v=Math.floor(hsh(gx,gy,s+143)*8);
        if(L.road.D[i]<LAB.road.w/2+3||L.BR[i]||Math.hypot((x-S.x*W)/S.rx,(y-S.y*H)/S.ry)<1.15)continue;
        const Wd=LAB.woods,wn=k===K.wood||k===K.grass||k===K.meadow?fbm(x/Wd.sc,y/Wd.sc,s+41,3):0,edge=smooth(1-Math.abs(wn-Wd.at)/Wd.fringe);
        const put=(img,ax,ay,kind)=>P.push({x,y,img,ax,ay,kind,layer:'nature'}),pic=(o,kind,low)=>P.push({x,y,img:o.img,ax:o.ax,ay:o.ay,kind,layer:'nature',low}),
          bp=(a,b)=>LAB.look.bush==='oak'||k===K.oasis?(hsh(gx,gy,s+148)<.6?a:b):LAB.look.bush,mo=LAB.look.moss;
        let q=r;
        // (the climate's own: lily pads on the pools, reeds round them; agaves and bones on dry ground)
        if(k===K.pool){if((q-=N.lily)<0)pic(lilyPic(v),'lily',true);continue}
        if(k===K.grass||k===K.meadow||k===K.wood){if(N.pondReeds&&[4,-4,4*W,-4*W].some(o=>L.KD[i+o]===K.pool)&&(q-=N.pondReeds)<0){pic(cattailPic(v),'reeds');continue}
          if((q-=N.agave)<0){pic(agavePic(v),'agave',true);continue}if((q-=N.bones)<0){pic(bonesPic(v),'bones',true);continue}}
        if(k===K.wood){if((q-=N.bush.wood)<0){pic(bushPic(v,bp('dark','oak')),'bush');continue}if((q-=N.log)<0){pic(logPic(10+Math.floor(hsh(gx,gy,s+145)*8),v),'log');continue}
          if((q-=N.stump)<0){pic(stumpPic(v),'stump');continue}if((q-=N.fern.wood)<0){pic(fernPic(v),'fern',true);continue}if((q-=N.mushroom)<0){pic(mushroomPic(v),'mushroom',true);continue}}
        if(k===K.grass||k===K.meadow||k===K.oasis){if((q-=N.bush.grass+N.bush.edge*edge)<0){pic(bushPic(v,bp('oak','birch')),'bush');continue}if((q-=N.sapling*edge)<0){put(PX.smallTree('grass','birch',v%3,false),8,15,'sapling');continue}
          if((q-=N.boulder.grass)<0){pic(boulderPic(v,11+(v%4)*2,mo),'rock');continue}if((q-=N.stone.grass)<0){pic(stonePic(3+(v%4),v),'stone');continue}
          if((q-=N.fern.edge*edge)<0){pic(fernPic(v),'fern',true);continue}if(k!==K.oasis&&(q-=N.flowers[k===K.meadow?'meadow':'grass'])<0){pic(flowersPic(v+Math.floor(hsh(gx,gy,s+147)*3)*8),'flowers',true);continue}}
        if(k===K.rock||k===K.scree){if(k===K.rock&&(q-=N.boulder.rock)<0&&L.G[i]<LAB.cls.cliff){pic(boulderPic(v,14+(v%4)*3,0),'rock');continue}if((q-=N.stone[k===K.rock?'rock':'scree'])<0){pic(stonePic(3+(v%5),v),'stone');continue}}
        if(k===K.bank){if((q-=N.cattail)<0){pic(cattailPic(v),'reeds');continue}if((q-=N.stone.bank)<0){pic(stonePic(3+(v%3),v),'stone');continue}}
        if((k===K.river||k===K.ford)&&L.DP[i]<N.shallow&&L.river.RW[i]<50&&(q-=N.stone.river)<0){pic(stonePic(3+(v%3),v),'stone');continue}}}
    const sx=S.x*W,sy=S.y*H,house=(type,dx,dy,seed,yaw)=>{try{const sp=PX.buildingModelSpec({type,culture:'vale',seed,yaw:yaw||0,env:LAB.climate==='temperate'?'grass':LAB.climate,snow:LAB.climate==='frost'});sp.cell*=2;const m=PX.model(sp);P.push({x:Math.round(sx+dx),y:Math.round(sy+dy),img:m.img,ax:0,ay:m.img.height,kind:'house',sh:m.shadow})}catch(e){console.warn('lab: no model',type,e)}};
    house('cottage',-150,-40,3);house('cottage',-60,-70,8,2);house('townhouse',40,-62,5);house('fisherhut',-170,58,9,6);house('well',-40,12,4);house('cart',30,24,6);house('tavern',90,40,12,4);
    // (the watermill beside the river, on its east bank)
    {const V=L.river,j=Math.round(LAB.river.mill*(V.pts.length-1)),[px,py]=V.pts[j];try{const sp=PX.buildingModelSpec({type:'watermill',culture:'vale',seed:21,yaw:6,env:LAB.climate==='temperate'?'grass':LAB.climate,snow:LAB.climate==='frost'});sp.cell*=2;const m=PX.model(sp);
      P.push({x:Math.round(px+V.rw[j]+4),y:Math.round(py+20),img:m.img,ax:0,ay:m.img.height,kind:'house'})}catch(e){console.warn('lab: no watermill',e)}}
    const folk=[['peasant',-20,30],['peasant',-90,20],['spearman',60,-10]];for(const [u,dx,dy] of folk){const d=PX.doll({race:'human',uniform:u,team:'blue',hair:'brown',style:'short'});P.push({x:Math.round(sx+dx),y:Math.round(sy+dy),img:d,ax:d.width>>1,ay:d.height-1,kind:'folk'})}
    return P}

  // a picture cut where the ground is nearer than its foot (wy): a ridge in front hides what stands behind it
  function occluded(img,X,Y,wy,Pn){const w=img.width,h=img.height,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(img,0,0);
    const d=g.getImageData(0,0,w,h),DD=d.data,W=LAB.W,dep=Pn.dep;let cut=false;
    for(let y=0;y<h;y++){const Y2=Y+y;if(Y2<0||Y2>=Pn.CH)continue;for(let x=0;x<w;x++){const X2=X+x;if(X2<0||X2>=W)continue;const o=(y*w+x)*4;if(DD[o+3]&&dep[Y2*W+X2]>wy+1){DD[o+3]=0;cut=true}}}
    if(cut)g.putImageData(d,0,0);return c}

  /* the lab: the canvas, the hero (click to walk there by the cells, WASD to walk), the panel's controls and numbers */
  PX.worldLab=function(root){
    const cv=document.createElement('canvas'),ctx=cv.getContext('2d');root.appendChild(cv);cv.style.touchAction='none';ctx.imageSmoothingEnabled=false;
    const panel=document.getElementById('panel'),out=document.getElementById('stats');
    applyClimate(LAB.climate);
    let L=makeLand(),Pn=paint(L),props=makeProps(L);const prints=[];
    const hero={x:LAB.shelf.x*LAB.W+20,y:LAB.shelf.y*LAB.H+40,face:1,walked:0,sta:1,path:[],climber:false,heavy:false,moving:false};
    let details=false,nature=true,walkmap=false,cam={x:0,y:0},keys={},fps=0,fa=0,fn=0,frameMs=0;
    // the props cut by the ground in front of them (kept until the land is painted again)
    const cut=()=>{for(const p of props){const lf=Pn.lift[p.y*LAB.W+p.x];p.X=p.x-p.ax;p.Y=p.y-lf+Pn.T-p.ay;p.pic=occluded(p.img,p.X,p.Y,p.y,Pn)}props.sort((a,b)=>a.y-b.y)};
    cut();
    let grass=makeGrass(L,Pn,props),grassOn=true,maxLift=0,gbuf=null;const gcv=document.createElement('canvas');for(let i=0;i<Pn.lift.length;i+=97)maxLift=Math.max(maxLift,Pn.lift[i]);
    if(innerWidth<LAB.phone)LAB.zoom=LAB.phoneZoom;{const z=document.getElementById('zoom');if(z)z.value=String(LAB.zoom)}
    const resize=()=>{const z=LAB.zoom;cv.width=Math.ceil(innerWidth/z);cv.height=Math.ceil(innerHeight/z);cv.style.width=cv.width*z+'px';cv.style.height=cv.height*z+'px';ctx.imageSmoothingEnabled=false};
    addEventListener('resize',resize);resize();
    // the cells' A*: a cell's cost by the class at its middle and the steepest of its corners (water and, but for a climber, cliffs shut)
    const C=LAB.W/LAB.cell,R=LAB.H/LAB.cell;
    // (each cell's class, counted once over all its px: water if a few px are (a river shuts it, but at its ford), a cliff if a few
    //  px are (a thin band still shuts it),
    //  else the steepest class enough of it has)
    let CC=null;const cells=()=>{CC=new Uint8Array(C*R);const cs=LAB.cell;for(let cy=0;cy<R;cy++)for(let cx=0;cx<C;cx++){const n=[0,0,0,0,0];
      let ford=0;for(let y=0;y<cs;y++)for(let x=0;x<cs;x++){const i=(cy*cs+y)*LAB.W+cx*cs+x;n[classAt(L,i)]++;if(L.KD[i]===K.ford)ford++}CC[cy*C+cx]=n[0]>=4&&ford<4?0:n[4]>=4?4:n[3]>=16?3:n[2]>=32?2:1}};
    function cellCost(cx,cy){const c=CC[cy*C+cx];if(c===0)return hero.heavy?Infinity:LAB.depth.swimCost;if(c===4&&!hero.climber)return Infinity;return [0,1,1.8,3.5,7][c]}
    cells();
    // (another climate: everything made again, the hero where he stood)
    let mist=[],flakes=[];
    const effects=()=>{mist=[];for(let k=0;k<LAB.mist;k++){let x=0,y=0;for(let t=0;t<40;t++){x=hsh(k,t,LAB.seed+170)*LAB.W;y=hsh(k,t,LAB.seed+171)*LAB.H;if(L.E[Math.floor(y)*LAB.W+Math.floor(x)]<4)break}mist.push({x,y,v:3+hsh(k,1,LAB.seed+172)*5,s:.7+hsh(k,2,LAB.seed+173)*.8})}
      flakes=[];for(let k=0;k<LAB.snowfall;k++)flakes.push({x:Math.random()*1600,y:Math.random()*900,z:Math.random()})};
    effects();
    const rebuild=name=>{applyClimate(name);for(const k in NAT)delete NAT[k];GATLAS=null;L=makeLand();Pn=paint(L);props=makeProps(L);cut();grass=makeGrass(L,Pn,props);
      maxLift=0;for(let i=0;i<Pn.lift.length;i+=97)maxLift=Math.max(maxLift,Pn.lift[i]);cells();prints.length=0;effects();hero.path=[]};
    {const cs=document.getElementById('climate');if(cs){cs.value=LAB.climate;cs.addEventListener('change',()=>{const ld=document.getElementById('loading');if(ld){ld.textContent='Making the land…';ld.hidden=false}
      setTimeout(()=>{rebuild(cs.value);if(ld)ld.hidden=true},40)})}}
    function route(tx,ty){const s0=Math.floor(hero.y/LAB.cell)*C+Math.floor(hero.x/LAB.cell),g0=Math.floor(ty/LAB.cell)*C+Math.floor(tx/LAB.cell),N=C*R,gs=new Float32Array(N).fill(Infinity),from=new Int32Array(N).fill(-1),open=[s0];gs[s0]=0;
      const hh=i=>Math.hypot(i%C-g0%C,((i/C)|0)-((g0/C)|0)),done=new Uint8Array(N);let it=0;
      while(open.length&&it++<40000){let bi=0;for(let k=1;k<open.length;k++)if(gs[open[k]]+hh(open[k])<gs[open[bi]]+hh(open[bi]))bi=k;const cur=open[bi];open.splice(bi,1);if(cur===g0)break;if(done[cur])continue;done[cur]=1;
        const cx=cur%C,cy=(cur/C)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=C||ny>=R)continue;const n=ny*C+nx,c=cellCost(nx,ny);if(c===Infinity)continue;
          const ng=gs[cur]+c*(dx&&dy?1.414:1);if(ng<gs[n]){gs[n]=ng;from[n]=cur;open.push(n)}}}
      if(from[g0]<0&&g0!==s0)return null;const p=[[tx,ty]];for(let k=from[g0];k>=0&&k!==s0;k=from[k])p.unshift([(k%C+.5)*LAB.cell,(((k/C)|0)+.5)*LAB.cell]);return p}
    // a click: the ground under it (the depth buffer), walked to
    cv.addEventListener('pointerdown',ev=>{const r=cv.getBoundingClientRect(),X=Math.floor((ev.clientX-r.left)/LAB.zoom+cam.x),Y=Math.floor((ev.clientY-r.top)/LAB.zoom+cam.y);if(X<0||Y<0||X>=LAB.W||Y>=Pn.CH)return;
      const wy=Pn.dep[Y*LAB.W+X];if(wy<0)return;const p=route(X,wy);hero.path=p||[];if(!p)note='No way there'+(hero.climber?'':' (cliffs: try Climber)')});
    addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true});addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
    let note='';
    // the panel's controls
    const lh=document.getElementById('lh'),lhv=document.getElementById('lhv');lh.min=LAB.lhMin;lh.max=LAB.lhMax;lh.value=LAB.lh;lhv.textContent=LAB.lh;
    lh.addEventListener('change',()=>{LAB.lh=+lh.value;lhv.textContent=LAB.lh;Pn=paint(L);cut();grass=makeGrass(L,Pn,props);maxLift=0;for(let i=0;i<Pn.lift.length;i+=97)maxLift=Math.max(maxLift,Pn.lift[i])});lh.addEventListener('input',()=>{lhv.textContent=lh.value});
    document.getElementById('climb').addEventListener('change',e=>{hero.climber=e.target.checked});
    {const hv=document.getElementById('heavy');if(hv)hv.addEventListener('change',e=>{hero.heavy=e.target.checked})}
    {const gt=document.getElementById('grass');if(gt)gt.addEventListener('change',e=>{grassOn=e.target.checked});
      const wd=document.getElementById('wind'),wv=document.getElementById('windv');if(wd){wd.value=LAB.grass.wind;if(wv)wv.textContent=LAB.grass.wind;wd.addEventListener('input',()=>{LAB.grass.wind=+wd.value;if(wv)wv.textContent=wd.value})}}
    {const nt=document.getElementById('nature');if(nt)nt.addEventListener('change',e=>{nature=e.target.checked})}
    {const dt=document.getElementById('details');if(dt)dt.addEventListener('change',e=>{details=e.target.checked})}
    document.getElementById('walkmap').addEventListener('change',e=>{walkmap=e.target.checked});
    document.getElementById('zoom').addEventListener('change',e=>{LAB.zoom=+e.target.value;resize()});
    // a step of the hero: by the keys, else along his path; his speed by the ground where he steps; stamina spent climbing
    function step(dt){let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
      if(dx||dy)hero.path=[];else if(hero.path.length){const [tx,ty]=hero.path[0];dx=tx-hero.x;dy=ty-hero.y;if(Math.hypot(dx,dy)<2){hero.path.shift();return step(dt)}}
      const l=Math.hypot(dx,dy);hero.moving=false;const i0=Math.round(hero.y)*LAB.W+Math.round(hero.x),c0=classAt(L,i0);
      if(!l){hero.sta=Math.min(1,hero.sta+LAB.sta.rest*dt);return}dx/=l;dy/=l;
      // (blocked straight on, he tries a little to either side, as a man steps round a rock)
      const run=keys.shift?LAB.run:1;let m=0,nx=0,ny=0,i1=0,d=0;
      for(const a of [0,.5,-.5,1,-1]){const ca=Math.cos(a),sa=Math.sin(a),ex=dx*ca-dy*sa,ey=dx*sa+dy*ca,mm=speedAt(L,i0,ex,ey,hero.climber,hero.sta,hero.heavy),dd=Math.min(l,LAB.walk*run*Math.max(mm,.0001)*dt),px=hero.x+ex*dd,py=hero.y+ey*dd;
        if(px<1||py<1||px>=LAB.W-1||py>=LAB.H-1)continue;const j=Math.round(py)*LAB.W+Math.round(px);if(mm&&speedAt(L,j,ex,ey,hero.climber,hero.sta,hero.heavy)){m=mm;nx=px;ny=py;i1=j;d=dd;if(a){dx=ex;dy=ey}break}if(!a){i1=j}}
      if(!m){hero.path=[];note=bandAt(L,i1)===4?'Deep water: '+(hero.heavy?'too heavy in armour to swim':'too tired to swim'):classAt(L,i1)===4?'A cliff'+(hero.climber?(hero.sta<=0?': too tired to climb':''):': only a climber goes up here'):classAt(L,i1)===0?'Water':'';return}
      hero.x=nx;hero.y=ny;hero.walked+=d;hero.moving=true;if(Math.abs(dx)>.2)hero.face=dx<0?-1:1;note='';
      const up=(dx*L.GX[i1]+dy*L.GY[i1])>0,c=classAt(L,i1),b=bandAt(L,i1),S=LAB.sta;hero.sta=Math.max(0,Math.min(1,hero.sta-(b===4?S.swim:b===3?S.wade:b?-S.rest*.3:c===4?S.cliff:c===3&&up?S.steep:c===2&&up?S.slope:-S.rest*.5)*dt+(S.heat&&!b&&L.KD[i1]!==K.oasis?S.heat*dt:0)));
      // (footprints on the ground that takes them, one every 4 px walked, left and right)
      const P=LAB.prints;if(P.kinds.includes(KNAME_ID[L.KD[i1]])&&!b){hero.pd=(hero.pd||0)+d;if(hero.pd>4){hero.pd=0;hero.side=-(hero.side||1);const px=Math.round(hero.x-dy*hero.side*1.5),py=Math.round(hero.y+dx*hero.side*1.5),j=py*LAB.W+px;
        if(j>=0&&j<L.KD.length)prints.push(px,py-Pn.lift[j]+Pn.T,performance.now());if(prints.length>900)prints.splice(0,3)}}}
    // (how high a man stands at px i: the bridge's deck over its span, else the land)
    const standLift=i=>L.BR[i]===1?Math.round(L.bridge.h*LAB.lh):Pn.lift[i];
    // a frame: the land, the props and the hero in order of their feet, each cut by the ground in front of it, the foam, the walk map
    let last=performance.now();
    function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;const f0=performance.now();step(dt);
      const W=LAB.W,hl=standLift(Math.round(hero.y)*W+Math.round(hero.x)),hx=hero.x,hy=hero.y-hl+Pn.T;
      cam.x=Math.round(Math.max(0,Math.min(W-cv.width,hx-cv.width/2)));cam.y=Math.round(Math.max(0,Math.min(Pn.CH-cv.height,hy-cv.height/2-10)));
      ctx.fillStyle='#1a2030';ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(Pn.cv,cam.x,cam.y,cv.width,cv.height,0,0,cv.width,cv.height);
      // (the foam: the shore's px that are cresting now)
      {const S=Pn.shore,t=now/1000;ctx.fillStyle='rgba(236,244,246,.85)';for(let k=0;k<S.length;k+=3){const x=S[k]-cam.x,y=S[k+1]-cam.y;if(x<0||y<0||x>=cv.width||y>=cv.height)continue;if(Math.sin(t*1.6+S[k+2]+S[k]*.02)>.55)ctx.fillRect(x,y,1,1)}}
      {const F=Pn.flow,t=now/1000;for(let k=0;k<F.length;k+=4){const x=F[k]-cam.x,y=F[k+1]-cam.y;if(x<0||y<0||x>=cv.width||y>=cv.height)continue;
        if(F[k+2]<0){if(((F[k+1]*.5-t*24+F[k+3])%5+5)%5<1){ctx.fillStyle='rgba(250,252,255,.8)';ctx.fillRect(x,y,1,1)}}
        else if(((F[k+2]*.35-t*6+F[k+3]*14)%9+9)%9<.6){ctx.fillStyle='rgba(225,240,245,.55)';ctx.fillRect(x,y,1,1)}}}
      if(details)ctx.drawImage(Pn.decor,cam.x,cam.y,cv.width,cv.height,0,0,cv.width,cv.height);
      if(walkmap)ctx.drawImage(Pn.wm,cam.x,cam.y,cv.width,cv.height,0,0,cv.width,cv.height);
      // (footprints, fading)
      {const P=LAB.prints,nw=performance.now(),c=P.col;for(let k=0;k<prints.length;k+=3){const a=1-(nw-prints[k+2])/1000/P.fade;if(a<=0)continue;const x=prints[k]-cam.x,y=prints[k+1]-cam.y;if(x<0||y<0||x>=cv.width||y>=cv.height)continue;
        ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${(.8*a).toFixed(2)})`;ctx.fillRect(x,y,2,1);ctx.fillRect(x+(prints[k]&1?1:0),y+1,1,1)}}
      // the hero's picture, cut by the ground before him
      const fr=hero.moving?Math.floor(hero.walked/5)%4:0,dl=PX.doll({race:'human',uniform:'swordsman',team:'blue',hair:'brown',style:'short',pose:hero.moving?'walk':undefined,frame:fr}),
        HX=Math.round(hx)-(dl.width>>1),HY=Math.round(hy)-dl.height+1,hp=occluded(dl,HX,HY,Math.round(hero.y),Pn);
      const ents=[];for(const p of props){if(p.layer==='nature'&&!nature)continue;if(p.X+p.pic.width<cam.x||p.X>cam.x+cv.width||p.Y+p.pic.height<cam.y||p.Y>cam.y+cv.height)continue;ents.push(p)}
      ents.push({y:hero.y,hero:true});ents.sort((a,b)=>a.y-b.y);
      const hb=bandAt(L,Math.round(hero.y)*W+Math.round(hero.x)),cut=LAB.depth.cut[hb];
      const drawEnt=p=>{if(p.hero){if(!hb){ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(Math.round(hx)-cam.x-4,Math.round(hy)-cam.y,9,2)}
          ctx.save();ctx.translate(Math.round(hx)-cam.x,0);if(hero.face<0)ctx.scale(-1,1);const sh=hp.height-cut;if(sh>0)ctx.drawImage(hp,0,0,hp.width,sh,HX-Math.round(hx),HY-cam.y,hp.width,sh);ctx.restore();
          if(hb){const wy=HY-cam.y+sh,ph=Math.floor(now/180);ctx.fillStyle='rgba(232,246,250,.75)';for(let k=-6;k<=6;k++)if((k+ph)%3)ctx.fillRect(Math.round(hx)-cam.x+k,wy-(Math.abs(k)>4?0:0),1,1);
            if(hb>=3){ctx.fillStyle='rgba(232,246,250,.4)';for(let k=-8;k<=8;k+=2)if((k+ph)%4)ctx.fillRect(Math.round(hx)-cam.x+k,wy+1,1,1)}}return}
        ctx.drawImage(p.pic,p.X-cam.x,p.Y-cam.y)};
      // the grass: every clump in view written into one buffer (south over north), laid under everything standing; then those just in front
      // of the man, over his feet, drawn again after him, so he wades through the grass rather than over it
      const A=grassOn&&grassAtlas(),n=LAB.grass.lean,Gr=grass;let front=null;
      if(grassOn){const G=LAB.grass,t=now/1000,y0=cam.y-Pn.T-12,y1=cam.y+cv.height+maxLift+12,R2=G.push,dec=Math.exp(-dt/G.spring*2.3),
          w1=t*1.9,w2=t*G.gust[1]*6.28/3,g2=6.28/G.gust[0],x0=cam.x-GW,x1=cam.x+cv.width+GW,s0=cam.y-2,s1=cam.y+cv.height+GH,bw=cv.width,bh=cv.height;
        if(!gbuf||gbuf.width!==bw||gbuf.height!==bh){gbuf=new ImageData(bw,bh);gbuf.u=new Uint32Array(gbuf.data.buffer);gcv.width=bw;gcv.height=bh}
        const U=gbuf.u;U.fill(0);
        let lo=0,hi=Gr.n;while(lo<hi){const m=(lo+hi)>>1;if(Gr.Y[m]<y0)lo=m+1;else hi=m}
        for(let k=lo;k<Gr.n&&Gr.Y[k]<=y1;k++){const X=Gr.X[k],Y=Gr.Y[k];if(X<x0||X>x1)continue;const sy=Y-Pn.lift[Y*W+X]+Pn.T;if(sy<s0||sy>s1)continue;
          // (the wind: two waves rolling across the land, the gusts; the hero's push, kept and fading as the grass springs back)
          const wind=G.wind*(Math.sin(w1+X*.05+Y*.03)+.8*Math.sin(w2+X*g2-Y*.01));
          let P=Gr.P[k];if(P){P*=dec;if(P<.05&&P>-.05)P=0}const dx=X-hero.x,dy=(Y-hero.y)*1.5;
          if(dx<R2&&dx>-R2&&dy<R2&&dy>-R2){const d=Math.hypot(dx,dy);if(d<R2){const p=(dx>=0?1:-1)*n*(1-d/R2)*1.2;if(Math.abs(p)>Math.abs(P))P=p}}Gr.P[k]=P;
          const lean=Math.max(-n,Math.min(n,Math.round(P?wind*(1-Math.min(1,Math.abs(P)/n)*.7)+P:wind)));Gr.L[k]=lean;Gr.S[k]=sy;
          const sp=A.px[(Gr.T[k]*4+Gr.V[k])*(2*n+1)+lean+n],D=sp.D,C=sp.C,bx=X-cam.x-5,by=sy-cam.y-9;
          for(let j=0,q=0;j<C.length;j++,q+=2){const x=bx+D[q],y=by+D[q+1];if(x>=0&&y>=0&&x<bw&&y<bh)U[y*bw+x]=C[j]}}
        gcv.getContext('2d').putImageData(gbuf,0,0);ctx.drawImage(gcv,0,0);
        // (in front of one standing: a clump south of his foot, by less than its height, within his width)
        front=(y,xa,xb)=>{let a=0,b=Gr.n;while(a<b){const m=(a+b)>>1;if(Gr.Y[m]<=y)a=m+1;else b=m}
          for(let k=a;k<Gr.n&&Gr.Y[k]<=y+GH;k++){const X=Gr.X[k];if(X<xa-5||X>xb+5)continue;ctx.drawImage(A,(Gr.L[k]+n)*GW,(Gr.T[k]*4+Gr.V[k])*GH,GW,GH,X-cam.x-5,Gr.S[k]-cam.y-9,GW,GH)}}}
      for(const p of ents){drawEnt(p);if(p.hero&&front)front(hero.y,hx-6,hx+6)}
      // (the swamp's mist: soft banks drifting east over the low land; the frost's snow falling, blown by the wind)
      if(mist.length){const t=now/1000;ctx.save();for(const m of mist){m.x+=m.v*dt;if(m.x>LAB.W+120)m.x=-120;const i=Math.max(0,Math.min(LAB.H-1,Math.round(m.y)))*LAB.W+Math.max(0,Math.min(LAB.W-1,Math.round(m.x))),
          x=m.x-cam.x,y=m.y-Pn.lift[i]+Pn.T-cam.y,w=180*m.s,h=56*m.s;if(x<-w||x>cv.width+w||y<-h||y>cv.height+h)continue;ctx.globalAlpha=.16+.06*Math.sin(t*.4+m.v);ctx.drawImage(mistPic(),x-w/2,y-h/2,w,h)}ctx.restore()}
      if(flakes.length){ctx.fillStyle='rgba(248,250,255,.85)';for(const f of flakes){f.y+=(10+f.z*22)*dt;f.x+=(LAB.grass.wind*6+Math.sin(now/900+f.z*9)*4)*dt;if(f.y>cv.height+2){f.y=-2;f.x=Math.random()*cv.width}if(f.x>cv.width+2)f.x=-2;else if(f.x<-2)f.x=cv.width+2;
        ctx.fillRect(Math.round(f.x),Math.round(f.y),f.z>.75?2:1,1)}}
      // (his path ahead, a dot at each turn)
      ctx.fillStyle='rgba(255,230,140,.8)';for(const [x,y] of hero.path){const l2=standLift(Math.min(LAB.H-1,Math.round(y))*W+Math.min(W-1,Math.round(x)));ctx.fillRect(Math.round(x)-cam.x-1,Math.round(y)-l2+Pn.T-cam.y-1,2,2)}
      frameMs=frameMs*.9+(performance.now()-f0)*.1;fn++;fa+=dt;if(fa>=.5){fps=Math.round(fn/fa);fn=0;fa=0}
      const i=Math.round(hero.y)*W+Math.round(hero.x),c=classAt(L,i),e=L.E[i],chunk=Pn.ms*512*512/(W*LAB.H);
      out.innerHTML=`<b>${fps}</b> fps · frame ${frameMs.toFixed(1)} ms<br>land ${L.ms.toFixed(0)} ms · paint ${Pn.ms.toFixed(0)} ms (≈${chunk.toFixed(1)} ms a 512 px chunk)<br>`+
        `here: level ${Math.max(0,Math.floor(e))} · ${KNAME[L.KD[i]]} · ${hb?['','ankle-deep','knee-deep','waist-deep','swimming'][hb]+' ('+(L.DP[i]*.85).toFixed(1)+' m)':['water','flat','slope','steep','cliff'][c]} · ×${(speedAt(L,i,1,0,hero.climber,hero.sta,hero.heavy)||0).toFixed(2)} east<br>`+
        `stamina <span class="bar"><i style="width:${Math.round(hero.sta*100)}%"></i></span>${note?'<br><em>'+note+'</em>':''}`;
      requestAnimationFrame(frame)}
    requestAnimationFrame(frame);
    PX.worldLab.state={LAB,get L(){return L},get Pn(){return Pn},get grass(){return grass},hero,get props(){return props},rebuild,classAt:i=>classAt(L,i),route};
  };
  PX.WORLD_LAB=LAB;
})(window.PX);
