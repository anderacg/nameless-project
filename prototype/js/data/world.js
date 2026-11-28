'use strict';
/* ---------- data: the world's scale: its named distances, one lever for how fast everything moves on screen, and how many wild
   things each size of map holds. Arrival and touch radii (8-20 px) are not here: they follow the figures, not the world.
   Units: px unless the group says tiles. ---------- */
/* the world drawn finer (doc/OPEN_WORLD_DESIGN.md phase 1, the owner, 2026-11-15: "apply this to the game"): fine screen-art px
   a game px for the world's scene (its ground, what lies flat, its buildings, the scene remembered under the fog), wherever the
   screen has that many (render.js sceneRes): a soldier then shows at his own 17 px, a house at 64. The simulation keeps its px.
   */
/* build: how large a building, a camp or a site stands to its game px: the world lab's scale (the owner, 2026-11-15: "Lab scale (~2
   men)"): a model's px a fine px, a cottage some two men tall; a holding's centre (its walls on the world's ways) at its own size.
   house: how large the holdings' other buildings and the sites stand (1: their own size, their models made finer, a model's px a
   fine px; the owner, 2026-11-16: "House scale too small need to change the sprite to be bigger"); sites: a kind of site's own
   times that (a whole number: its model made as many times finer again), the shrine's standing stones else no taller than a man */
/* zoom: CSS px a fine px on the map, the world lab's (engine/worldlab.js LAB.zoom), phoneZoom on a window narrower than phone CSS px
   (its phoneZoom, phone); the map never shows the world smaller than this (the owner, 2026-11-15: "Remove all old concepts that
   reduce the map scale"), and closer at most in times it */
const WORLD_VIEW={fine:2,build:.5,house:1,sites:{shrine:2},zoom:2,phoneZoom:1.5,phone:700,in:2};
/* the map painted round you as you play (gfx/worldart.js WorldArt; the owner, 2026-11-18: "after i walk my character to new areas it
   seems to have long load time"): a chunk takes a second or more to paint (several on a phone), so in play none is painted whole in
   one frame. One in view not painted yet shows the minimap's colours while it is painted, view ms a frame; those queued ahead get
   what their deadline asks: the work left (est ms a chunk at first, then as measured, eased by learn; rest of it at least for one
   begun) over the time before the view reaches them at its speed (speed game px a second at least; soon ms at the least), safety
   times over, slice ms a frame at least, most at most. The view's speed and the frame's length eased by ease. A chunk half painted
   is kept, keep of them at most, while it stays near the view. In play while the game's loop drew within alive ms (one slow frame,
   a model made, never makes the next paint a chunk whole). The way the view moves: its heading eased by turn a frame, a way taken
   where the heading leans lean or more along it (.38: aslant takes both), none while the view's speed is still px a second or less */
const ART_PACE={view:25,most:18,slice:4,est:3000,learn:.3,rest:.1,speed:8,soon:250,safety:1.25,ease:.1,keep:2,alive:2000,turn:.15,lean:.38,still:4};
// the map's painter workers (gfx/worldart.js ArtWorkers): on in play; how many on a phone, and at most elsewhere (never more than the
// device's cores less one; each worker holds a whole second copy of the game and its world, about 300 MB at a phone's size, so one on a
// phone); help: ms a chunk in view may wait for a worker before it is painted here too (the first done kept)
// (phone 0: none on a phone till one is measured there (each worker holds a whole second game, ~300 MB; Safari may close the tab), ?workers
//  for one: the owner, 2026-11-18)
const ART_WORKERS={on:true,phone:0,most:4,help:400};
/* the painted ground kept on the device (gfx/artkeep.js ArtKeep, its keeper gfx/artkeepworker.js): on; db: the browser's store
   (IndexedDB); most: how many chunks it holds, on a phone and elsewhere (a chunk about 3 MB kept: 100 MB on a phone), the oldest let go; touch: ms after
   which one read is written again as new; patience: ms the painter waits for the keeper's answer before it paints; strip: the rows of
   a picture read in one piece of a frame; sheet: the width (px) of the sheet a chunk's props' sprites are kept on; queue: painted
   chunks waiting to be kept, at most; sprites: the props' sprites the page holds from the keeper before it lets them go and has them
   sent again; v: the kept record's shape (part of the stamp); stamp: a stamp given (the tests'), else the
   scripts' own hash */
const ART_KEEP={on:true,v:1,db:'ashmark-ground',most:[32,160],touch:21600000,patience:1500,strip:128,sheet:1024,queue:12,sprites:6000,stamp:null};
/* the world's terrain drawn finer (gfx/worldterrain.js; doc/OPEN_WORLD_DESIGN.md phases 1 and 2; the world lab's look): its climates
   read at a place warped climWarp game px by noise, each px's picked from their shares (climPick: by a slow noise at sc game px, spread k, grain at its edge: ragged
   tongues and islands, not salt and pepper), so no climate's edge follows the tiles; the frost's snow in drifts (snowPatch: its noise from
   lo to hi eased in, grain at its edge, its tones by noise at shade fine px, tufts the share of its grass clumps gone under it);
   what the game painted over the ground (over: the trampled patches and yards) keep of the fine ground's own colour in it, grain its
   grain, feather the game px over which it thins into the ground round it, blur the game px its
   colours are blurred over (a yard meets the worn ground round it softly); the grass's clumps thinned over a lot's
   tiles read at a place warped warp game px; open land meadow where a slow noise (with quick of a quicker one in it) passes
   meadow.at, the grass shading into it over band either side, grain at its edge; the sea's and lakes' shores a smooth curve over their tiles, read at a place warped shore.warp game px (noise at
   shore.sc), shore.bias toward the water so no water tile's middle is land; a wide river's banks the same curve over its tiles, shore.river toward the water
   (so its own curves lie inside it), its dirt bank along that curve to shore.bank of the field past it; a river's water shore.lip fine px under its banks, its dirt edge (an earth face) along it; no terrace
   step within shore.unstep banks' width of a river (its bank one smooth slope, never stairs); the dry land within a lake's or a pool's tiles
   eased from the land round it down to its water over shore.basin game px (the generator holds such a tile at its water's level: a flat
   square floor stepped up at the tile's edge); its curves read reach game px further out, so the smooth bank is never cut short; the land drawn lifted up the screen by its height, up to liftMax levels; lh fine px of
   face a level (the lab's 8); the land's levels between the tiles' (worldgen.js reliefOf) roughened by detail levels (noise of sc
   fine px; a mountain's mount times more); steps: stepped (a terrace, its face hanging over the land south of it) where its slope
   (levels a game px) is from or more, wholly by to; a face only where it steps min levels or more at once (a river so stepped a fall: its white water falls.lip game px above it, its foam pool falls.pool below, seen whichever way it runs, across falls.wide of its half-width only; a reach of falls.rapid.hw game px of half-width or more, within rapid.mouth px along it of still water or a wider river it runs into, or within rapid.bridge px of a bridge's ends, no fall but rapids: its levels eased over rapid.ramp px, white streaks rapid.streak long, full at a slope of rapid.white levels a px, rapid.join px the way back a mouth is told by); rim: where the ground falls away north, west or east more than drop fine px (a face unseen), its crest px darkened to north (north) or side; gentle ground is shaded; never within flat game px of a road, a
   holding's lot or a ford. Rock shows on land from rock levels up, snow from snow (each by noise of a level or two); the shore:
   wet sand within wet fine px of the sea, the beach within sand, dunes within dune (on land below a level); a river's bank within
   bank (shore widths in lab px: the lab's wet 5, sand 34, dunes 80); oasis: the desert green within it of a river; pools: the swamp's
   (its noise past at at sc lab px, on land under lo levels, as deep as its excess times deep); blend: the lab's (r lab px, k, warp);
   decor: the small things' colours. Water: depth (levels) a tile's depth step (the plan's dep 0-9), the bed showing to clear levels;
   water: one look for the rivers, lakes, pools and the sea (the owner, 2026-11-18: "make river and lake, ponds colors and
   characteristics blend"): a river's colours the open water's by depth with murk of its own kept, its bed showing to clear levels;
   where it runs into still water it eases into it over mouth game px (its depth to the still water's, a lake's measured to the land
   that is no river's water either, its colours and bed, its current's streaks); at every shore and bank a broken foam within rim game px
   (a river's by its half-width: rim of it at hw game px and over), at most foam white; the foam riding a river's banks on bankFoam
   of its edge px (a lake's on all) */
/* the world's nature drawn finer (gfx/worldterrain.js terrainProps; the world lab's, engine/worldflora.js): per climate its look (the
   flora's rock tones, bush leaves, moss, snow on everything), its trees by where they stand (lowland, waterside: a river within a
   tile; hills; mountain; village: a holding's lot within two tiles; each mix by weight) and the chance of each thing a cell of step
   fine px by the ground: woods (a forest tile; trees at woods, thinner at its edge), open ground (grass and meadow), hills, the
   mountains, the banks, the swamp's pools (lily: a pad's chance on one, reeds: round its edge, the lab's); grass: a clump's chance by the ground and the clumps' kinds (the flora's GRASS_KINDS); how it moves (gfx/worldterrain.js
   terrainEnts): wind, gust (every clump's sway: the wind alone moves it, no foot, the owner, 2026-11-28), lean (its most, px) */
const WORLD_FLORA={step:9,
  look:{grass:{rock:'grey',bush:'oak',snow:false,moss:1},desert:{rock:'sand',bush:'dry',snow:false,moss:0},frost:{rock:'cold',bush:'dark',snow:true,moss:0},swamp:{rock:'grey',bush:'dark',snow:false,moss:1.6}},
  trees:{grass:{lowland:{oak:5,beech:3,birch:2.5,ash:2,maple:.6,poplar:.4,dead:.25},waterside:{willow:4,alder:3,birch:1,poplar:1},hills:{pine:4,fir:3,birch:1.5,oak:1,dead:.3},mountain:{fir:4,spruce:4,pine:1,dead:.5},village:{apple:3,oak:1,poplar:1}},
    desert:{lowland:{acacia:4,dead:2,palm:.5},waterside:{palm:6,acacia:1},hills:{acacia:2,dead:2},mountain:{dead:1,acacia:1},village:{palm:4,acacia:1}},
    frost:{lowland:{spruce:4,fir:3,winterbirch:2,dead:.6},waterside:{winterbirch:3,spruce:2},hills:{spruce:4,fir:2,dead:.4},mountain:{spruce:3,fir:2,dead:1},village:{spruce:2,winterbirch:1}},
    swamp:{lowland:{bogtree:4,alder:3,willow:2,dead:2},waterside:{willow:3,bogtree:3,alder:1},hills:{alder:2,birch:2,oak:1,dead:1},mountain:{fir:2,spruce:1,birch:1,dead:1},village:{willow:1,alder:1}}},
  chance:{grass:{woods:.6,open:{tree:.012,bush:.012,boulder:.002,stone:.006,flowers:.02,fern:0},hills:{tree:.05,bush:.02,boulder:.012,stone:.02},mountain:{tree:.02,boulder:.03,stone:.05},woods2:{bush:.08,log:.012,stump:.008,fern:.06,mushroom:.014},bank:{cattail:.08,stone:.04}},
    desert:{woods:.25,open:{tree:.01,bush:.006,boulder:.004,stone:.014,agave:.012,bones:.002},hills:{tree:.02,boulder:.02,stone:.03,agave:.01},mountain:{boulder:.03,stone:.05},woods2:{bush:.07,agave:.02},bank:{cattail:.05}},
    frost:{woods:.6,open:{tree:.01,bush:.008,boulder:.003,stone:.006},hills:{tree:.05,bush:.01,boulder:.012,stone:.02},mountain:{tree:.015,boulder:.03,stone:.05},woods2:{bush:.05,log:.01,stump:.01},bank:{cattail:.03,stone:.03}},
    swamp:{woods:.5,open:{tree:.02,bush:.02,stone:.0015,flowers:.006},hills:{tree:.05,bush:.02,boulder:.004},mountain:{tree:.02,boulder:.02,stone:.03},woods2:{bush:.06,log:.025,stump:.016,fern:.06,mushroom:.035},bank:{cattail:.2},pool:{lily:.1,reeds:.12}}},
  grass:{step:6,chance:{grass:{open:.38,meadow:.55,woods:.12,dune:.3},desert:{open:.05,meadow:.015,woods:.2,dune:.12},frost:{open:.3,meadow:.03,woods:.02,dune:.12},swamp:{open:.5,meadow:.3,woods:.22,dune:.35}},
    kinds:{grass:{open:'grass',meadow:'meadow',woods:'wood',dune:'dune'},desert:{open:'dry',meadow:'dry',woods:'dry',dune:'dune'},frost:{open:'frost',meadow:'frost',woods:'frost',dune:'frost'},swamp:{open:'marsh',meadow:'marsh',woods:'wood',dune:'marsh'}},
    patch:38,wind:1,gust:[90,.65],lean:3,
    layer:{every:2,margin:8,band:32}}};// (layer: in play the grass layer made every every-th frame, margin fine px round the view, cleared, put and laid by band-row strips: worldterrain.js terrainEnts)
/* the world's ways drawn finer (gfx/worldways.js; the owner, 2026-11-15: "make the lab river several sizes, there can be a big
   river"), in the lab's px (two a game px). river: half-widths by size (hw: [unused], a river one, two and three tiles wide (the
   generator's widths); a brook's from brook[0] to brook[1] by its flow); its bank (mud) bank px; depth (levels) down its middle by
   size (a brook's first), a ford's share of it; a river's ford as a gravel bar (fordBar: band game px beside the road it runs out, its
   edge warp px ragged, the ford's tiles blended over blend of a tile's B-spline (no tile's square), gravel its bed's share showing, riffle
   the noise over which its edge runs white, stone the share of cell fine px cells with a stepping stone); how far it wanders off its tiles' line (meander, px, never out of them); its last
   stretch into the sea or a lake mouth times wider (its water easing into the still water's: WORLD_TERRAIN.water); a river rising
   from tarn.lv levels up rises from a tarn (its head tarn.w times wide); its surface stepped step levels at a time, a fall at each
   (the lab's; 0: smooth). A brook rises from a spring, a pool spring times its width at its head. A river's line simplified within simp of a tile of
   its tiles' middles, then wandering in bends meanderL px long, up to meanderBig px off it (a brook's 26 long, meander off), so no river runs
   dead straight along a row of its tiles. Its current (flow, the owner: "make a water effect like water"): streaks running down it,
   len px long every period px along lanes lane px apart across it, at speed px a second; a lane's streaks only where noise gate px
   long along it is over on, and within edge of its half-width of its middle, fewer farther out (period must divide 30000); its
   line smoothed over smooth times its half-width each way for it. wide: by its half-width (game px, hw a stream's to a big river's),
   its lanes out to edge of it, lit where the gate's noise is over on, its streaks len px long in its middle (mid less at its edge),
   speed times as quick, each every per times its length at least (the owner, 2026-11-18: "more line on the big river/stream");
   stride: a chunk's flow record's numbers a px. road: the lab's (LAB.road, the owner: "why the road scale not match with the lab?"):
   half-widths (a track, a road: both the lab's 13, 26 wide), its width wandering vary of it along it, its corners rounded (bend
   more cuts of its line); its worn look: a packed crown in
   patches, no wheel ruts (the bands' tracks are drawn: world/tracks.js; track: the wear down a bridge's deck), gravel, puddles past puddle, a ragged edge of edge px, shoulders sh px,
   a stone wall only on faces within wall px of its edge (the lab's; its shoulders' faces earth or rock).
   road grade: levels a game px it climbs at most (the lab's 1 in 34 lab px), its shoulders cut or banked to it.
   Its look by the land it runs through (biome, the climates' order: grass, frost, desert, swamp; the owner: "make it blend more
   naturally with biomes"): mix of the ground's colour in it, and the ground over it in patches where its noise passes patch (snow,
   sand drifts, mud); at a dead end it narrows and fades into the land over fade game px.
   bridge: its deck clear levels over the water, the road ramped up to it within ramp game px of each end; along its road's line
   across the water, over game px onto each bank; over open space (water, or more than open px under its beams) a pile every pile px
   at most (a stone bridge's arch every arch), evenly, nothing under it where its bank carries it; rails rail px tall, a
   post every post px; no pier standing out of its sides within cut.end px of its very end (its abutment on the bank); its shadow shade px to the south-east and cast x its height over what lies under it more (east, south: worldways.js bridgePic), shadow its alpha (0-255); to a bank lower than its deck it comes down by stairs (the owner, 2026-11-21: "Why dont you make a stairs based on the height that player have to go up?"; worldways.js bridgeFall): a step of stair.rise down every stair.tread px (lab px), as many as its height, its treads shaded stair.shade by turns, each one's edge lit stair.nose, its riser stair.riser, one on them looked for within stair.run game px past its end; the road raised to its deck within fill game px of each end (0: none, the bank left as it lies and the stairs down to it; it was ramp px, an earth fill up to the deck, both its ends at one height); the road's fill under only abut game px of each
   end, its open span the river and its banks as they are (worldways.js bridgeOpen); a brook under a road: a small bridge along
   the road, the brook's width and brook.span px of bank each side, its deck brook.clear levels over the water at least, none within
   brook.apart px of another bridge; on a track or over a brook under brook.ford px wide, a natural ford instead (shallow over gravel);
   a stone deck's flagstones flag.w by flag.h lab px, staggered, mortar their seams' shade, a kerb kerb lab px along each side, vary
   their tones; a bridge running north and south: its piers cutwaters out cut.out lab px past its sides, cut.half lab px half-wide;
   its ends run on past the water as drawn to dry ground (reach game px at most), its deck at the higher bank, a ramp falling to the
   lower at slope (fine px a fine px) over a stone abutment; where its river runs on a slant (within diag radians
   of the diagonal), it is turned to cross it square, on the slant; walked only inside its rails, walk game px in from each side (world/router.js
   deckLane) */
const WORLD_WAYS={river:{step:1,spring:2.4,simp:.45,meanderL:110,meanderBig:18,hw:[0,10,22,38],brook:[2.6,4.8],bank:8,depth:[.36,.5,1,1.5],ford:.25,fordBar:{band:3,warp:3,blend:.42,gravel:.42,riffle:.6,stone:.2,cell:5},meander:6,mouth:1.6,tarn:{lv:3,w:3.2},
  flow:{lane:1.5,gate:22,on:.55,speed:10,period:30,len:7,edge:.7,smooth:2.5,stride:5,
    wide:{hw:[1.5,9],edge:[.55,.88],on:[.62,.34],len:[5,15],mid:.45,speed:[1.3,.8],per:3.2}}},
  road:{hw:[13,13],sh:22,vary:.18,bend:3,grade:.06,fade:36,biome:{mix:[.1,.3,.35,.22],patch:[.72,.56,.58,.6]},track:.42,wander:1.3,gravel:.07,puddle:.74,edge:3,wall:5},
  bridge:{clear:1.4,ramp:28,over:6,abut:4,open:3,brook:{span:3,clear:.6,apart:24,ford:1.6},pile:12,arch:26,rail:5,post:8,shade:3,shadow:96,
    flag:{w:6,h:4,mortar:.86,kerb:2,vary:.14},cut:{out:5,half:3,end:10},reach:28,diag:.45,walk:2,cast:[.55,.3],fill:0,stair:{rise:2,tread:3,shade:[1,.92],nose:1.12,riser:.7,run:24}}};
// (prints: footprints, the lab's: one every step px a man walks (a foot's stride: left, then right), side px off his way, fading over
// fade s, max kept; on snow, sand, the marsh, and ground within bank px of drawn water, in their colours, a print's rim rim of its
// strength: worldterrain.js stepPrint; each a foot's shape (PRINT_FOOT), pointing the way he walks)
/* a footprint's shape (worldterrain.js printFoot; the owner, 2026-11-17: "Tracks footprints is in the wrong position and not realistic"):
   at 2 fine px a game px, its sole (the ball and toes: its middle along the foot, its half-length, its half-width) a little to its
   inner side (inner), its heel apart behind it, the same; turned to one of dirs ways, a left foot the right one mirrored; deep within
   deep of its middle. The way's prints (worldui.js wuiFoot) and the tracks men leave (stepPrint) both */
const PRINT_FOOT={sole:[1.2,1.7,1.2],heel:[-1.7,.8,.7],inner:.3,deep:.55,dirs:16};// (its heel smaller than its sole, so at 8-9 px a print it points the way walked on the slant too)
/* rocky ground round a cave's mouth (gfx/worldterrain.js caveRocks, caveShare; the owner, 2026-11-16: "add rocky area that blend the
   caves"): whole within r - feather game px of its mouth (up px above its site's middle), thinning to the land over feather, its edge
   warped warp px by noise and grained; flat (y times flat); bare rock in patches over rock of it (its noise), the ground stony past bare
   (pebbles, no grass clumps, no trees); boulders and stones as props by their chance at its full share */
const CAVE_ROCK={r:30,feather:16,warp:11,grain:3,up:6,flat:1.3,rock:.55,bare:.55,boulder:.05,stone:.12};
/* face: a land face's look (gfx/worldterrain.js faceTexel, the owner, 2026-11-19: "please fix that straight line steep hill"): a face of low
   fine px or less a soft step (lowK of the top's colour); the grass over a lip up to over fine px (overRock over rock; overK its shade; a wave along overSc
   fine px); a root on root of the columns, up to rootLen px; rock where a face is rockN levels tall (from, wholly), steep (steep times
   steepG) or high, sand where the land is lower than sand levels (wholly, none); the kinds mottled where they meet (blot: the noise's
   fine px across and down, mix its say); rock in strata band px tall of blocks block px wide, their bedding broken (crackGap), a joint
   by joint of them, wavering wob px along wobSc; earth's horizons along horizon px, pebble of its px; shaded shade either way by noise at
   sc px, foot darker down it; foam on foam of a wet foot's px; log: each face column recorded (tests only, off) */
const WORLD_TERRAIN={face:{low:5,lowK:.62,over:2.4,overSc:6,overRock:1,overK:.9,root:.06,rootLen:4,rockN:[1.4,2.6],steep:[.85,1.15],sand:[1.05,1.4],blot:[5,4],mix:.7,band:5,block:[4,10],crackGap:.22,joint:.6,wob:4,wobSc:17,horizon:11,pebble:.03,shade:.12,sc:[6,15],foot:.22,foam:.3,log:false},prints:{step:2.6,side:.8,rim:.5,fade:40,max:4000,bank:6,kinds:{snow:0,sand:1,marsh:2,wet:3,grass:4,dirt:5},col:[[110,130,170],[150,112,66],[44,38,24],[96,78,52],[50,42,26],[54,38,22]],strong:[1,1,1,1,.85,.75],seen:2,pad:1.2},climWarp:14,climPick:{sc:7,k:2.2,grain:.3},snowPatch:{lo:.5,hi:.63,grain:.06,shade:9,tufts:.85},over:{keep:.25,grain:.08,feather:4,blur:3,warp:10},meadow:{at:.62,band:.06,quick:.3,grain:.025},shore:{warp:9,sc:34,bias:.15,river:.62,bank:.6,lip:2,unstep:3,reach:12,ice:16,basin:7},liftMax:20,steepG:.22,cliffG:.44,lh:8,detail:.7,sc:46,mount:1.5,steps:{from:.16,to:.32,min:.45,band:1},falls:{lip:4,pool:9,wide:1.2,rapid:{hw:8,mouth:48,join:16,bridge:14,ramp:22,white:.09,streak:5}},rim:{drop:3,north:.68,side:.8},flat:6,rock:11,snow:14,wet:5,sand:34,dune:80,oasis:22,pools:{at:.56,lo:4,deep:3.5,sc:44},blend:{r:8,k:.85,warp:10},
  decor:{flower:[[236,220,90],[236,240,246],[200,150,210],[240,160,120]],marram:[[214,204,150],[180,172,116]],drift:[[160,138,108],[196,178,146]],shell:[238,230,216],litter:[[110,92,50],[96,80,44],[128,104,58]]},bank:5,depth:.32,clear:.9,water:{murk:.3,clear:.6,mouth:18,rim:1.6,hw:6,foam:.5,bankFoam:.4},shade:.55};
/* the map's ground from stored pieces (gfx/tileground.js TileSet, tileChunk; the owner, 2026-11-24: "would it better if we skip those
   drawing by using tileset concept?"): on (true; 'phone': on a phone only; a page's ?tiles on, ?tiles=0 off); period: a stored
   texture's side (fine px, seamless); cross: the px its edges cross over; noise: the stored edge noise's side; rag: how ragged an edge
   between two grounds is (the noise's share of the threshold); hs: the land's heights' grid (game px); bufs: the painter's buffers kept; water.band: the depth (levels) of each stored water band */
const TILE_GROUND={on:false,period:128,cross:16,noise:256,rag:.55,hs:4,bufs:2,water:{band:[.2,.7,1.4]}};
const WORLD_SCALE={
  // every step on the map is moveStep(pace, d): pace (px per world second, unscaled) x d x move. Flee odds and chase choices
  // read the unscaled paces, so this changes how fast things look, never who outruns whom. .68 (D9): a band on foot some 9 px a
  // second on open ground at 1x, 100 tiles (25 km) a day
  // Campaign travel is 1.28 times the base pace (was twice, then 1.6: the owner, 2026-10-31, "drop campaign speed about 20%", and
  // 2026-11-14, "reduce world moving speed for all", 20% more); everything on the map moves by it, you and the world alike, a fight
  // on the map too (battle.js; the owner, 2026-11-16: "the speed between battle and world seems weird": it kept the base scale).
  // (the world lab's walk (the owner, 2026-11-15: "the lab's walking speed"): a man on open ground some 19 game px a second at 1x (the
  // lab's 38 lab px), 1.63 times the 11.7 measured before; a day as many times longer (core.js DAY_SECONDS), so a day's march is
  // the same ground and everything counted in days keeps its pace)
  move:1.11,travel:1.28,
  // how far each kind sees you, before your cover cuts it (Brain.sight, hiddenAt)
  sight:{lord:90,band:95,monster:70,caravan:80,refugee:70},
  // what the parties weigh (brains.js, monsters.js, critters.js, folk.js, companions.js, patrols.js)
  ai:{
    graceGap:24,// after a fight (G.encCool) hunters keep this far off
    grace:1.47,// and the grace lasts this many times its world time (1/move), so the gap you open in it stays as it was
    dread:70,// a marching lord turns home from an enemy army half again his strength this near
    bandCamp:220,// a band shelters at night in a camp this near
    refugeAt:24,refugeLane:24,// a frightened party shuns a refuge your army is at (this past the reach to meet it) or across its way to (this past your ring): engage.js safeRefuge
    lairHunt:140,lairLeash:60,// a beast hunts you only this near its lair; wanders back past the leash
    mythicRoam:[120,90],mythicScorch:200,// a mythic beast's next roam (x, y), and how near a holding it burns the fields
    gameLeash:50,herdLeash:24,penLeash:99,// wild game, livestock and a penned herd wander back past these
    compFoes:90,compFlee:70,compBeat:[80,60],// your companion's party: foes it weighs, runs from the strong ones, its holding's beat (x, y)
    compTake:60,compDraft:120,// (companions.js) handing soldiers over, drafting at a holding
    folkNear:520,folkForget:120,// workers live round holdings this near you; gone past it plus folkForget
    folkBandit:70,folkFear:90,// a worker hurries home from bandits, or from you while his holding fears you
    slipAway:40// running from the guards puts this between you
  },
  // where new things appear: never nearer you than [at the start, later], nor a holding. The owner, 2026-10-19: bands never
  // nearer a holding or any of its built estates than away (outlaws lurk out on a land's reaches, by the roads); a beast makes
  // its lair in the wilds, on no holding's land, or, its kind's ground not found there this time, within rim tiles of a land's
  // edge and away from every holding and estate (monsters.js lairLand); a rare kind (its weight w at most rare: a troll, a griffin, a
  // wyrm) and a mythic one rareK times as far from the holdings, a rare one from you too (2026-11-13)
  spawn:{bandit:[220,260],monster:[180,240],monsterHold:352,mythic:200,rare:1.2,rareK:2,critter:[120,200],critterHold:56,away:120,rim:3},
  // trade and work (tiles): realm caravans' range and their cost of distance, where refugees go, a holding's veins and its own
  econ:{caravanNear:10,caravanFar:90,caravanCost:150,refuge:70,resRange:10,homeRange:24},
  // deeds and who hears of them (tiles): field deeds and road events count for a holding this near, a sack angers those this near
  law:{repNear:15,eventNear:15,siegeOutrage:20},
  // the land round a holding: its shelter from the land (px), healing near a friendly one (px), its garrison guards an estate (tiles);
  // territory (tiles): friendly holdings this near raise its reach's cap, a camp cleared this near pushes it out (territory.js)
  land:{shelter:48,healNear:80,estateGuard:7,friendly:50,pacify:35},
  // war: a realm fortifies a holding with an enemy this near (tiles); walking this far off ends your raid or siege (px)
  war:{front:60,raidLeash:80,siegeLeash:80},
  // a battle's reach into the world round its tile (tiles; worldmap.js battleSite): an elven town this near makes elven woods;
  // road bridges seen this far (the battle's own reaches, terrain.js TERRAIN_RIVER.near and engage.js BTYPE_WORLD.near, within it)
  battle:{elfR:10,bridge:2}
};
const moveStep=(px,d,travel=true)=>px*d*WORLD_SCALE.move*(travel?WORLD_SCALE.travel:1);
/* on foot (the owner, 2026-11-15: "ensure that all characters in the game use the same speed system not separated"): everyone
   walking the map by himself (the holdings' and the camps' people, the estates' workers, the hunters, the clearers, an outpost's
   sentries, an army's men filing in at a gate) goes at a man on foot's pace in an army (unit's: world.js footPace), times his
   gait, by the world's clock (moveStep); his legs a step each WALK.foot × WALK.step px as the marchers' (footFrame). His gaits are
   the one ladder's (data/speed.js SPEED.gait: stalk, laden, stroll, hurry; his walk its march, his run its flee: SPEED.foot) */
const ON_FOOT={unit:'militia'};
/* sight by kind (the owner, 2026-11-01: "Every unit spots now and has its vision range, so the army should depend on all units'
   capabilities"): each man's share of a character's sight, the one table for the map (fog.js Sight: your army's eyes, and every
   army's eyes for a threat on the march, marchstyles.js TravelStyle) and for battle (battlefog.js fogRange: FOG.char px times it,
   rounded: 220, 260, 300). The most of those that fit him: a rider's, a shooter's, else a man on foot's; a character's char. A scout
   (data/units.js SCOUT_KINDS, isScout: light horse, rangers, hunters; a new scout unit needs only its kind there) sees scout times
   his kind's. In battle Scout ahead (unitabilities.js) still multiplies it while on */
const SIGHT_KIND={char:1,foot:.786,shoot:.929,mounted:1.071,scout:1.6};
// (kind k's share (s: its stats, ST[k] unless given: a battle's soldier carries his own); the farthest any kind sees)
function sightShare(k,s=ST[k]){const S=SIGHT_KIND;if(!s)return S.char;let r=S.foot;if(s.range&&S.shoot>r)r=S.shoot;if(s.mounted&&S.mounted>r)r=S.mounted;return isScout(k)?r*S.scout:r}
const sightMost=()=>{const S=SIGHT_KIND;return Math.max(S.char,S.foot,S.shoot,S.mounted)*S.scout};
/* how many of each wild thing a world holds (doc/WORLD_DESIGN.md §10.6). classic: the base caps and starting counts (the old
   hand-made map's, the measure every world grows from); sites by kind (sites.js SITE_TYPES), camps by the map's spots; daily: the
   tries a day to bring bands, beasts and game back.
   grow: how each count follows a bigger world: the base number x (the world's measure / the base's)^pow, rounded, by its key
   in by ([measure, pow]; sites, a rule for each kind); daily: each kind's tries grow as the count named. The measures:
   land (tiles not water, a ford water: the base 32,042), holdings (the realm holdings the world was made with: the base 37),
   ports (the world in's holdings with a port as it first stood: the base 9), roads (the road's tiles between the holdings, a
   great road's 1, a track's track, never an estate's track: the base 1,680), wild (the land far from every holding and road, world/sites.js wildLand: the base 37,400, so the
   classic seed's 46,773 make 30 hideouts). pow 1 keeps the base number per tile of land, per holding, per port or per tile of
   road; above 1 a bigger world is busier, below 1 emptier (the bands .8: fewer to a holding than the land alone would give). The camps where
   people live are counted by kind (data/encampments.js ENCAMP_KINDS count, ENCAMP.count: by the land, at least one each); caves, ruins and shrines about 1.5 x the base on the classic seed ("ok 1.5": its land 3.19 x the
   base's, ^.35), growing gently past it. The owner, 2026-10-23: the hideouts deep in the wilds, by the wild land, about half the
   land's (61 on the classic seed, now 30). The generated classic seed grows as any world */
// the humble start (doc/START_AND_GATES_DESIGN.md §1.2; world/start.js StartPlace): on (the harness turns it off: the older suites
// start at the capital's gate), off: days' march at least from every capital (the classic map's farthest hamlet some .7 days off);
// the fair place's rules: no bandit camp or hideout within camp tiles, no wild region within wild; a
// realm's village or bigger within next days, a road joining them; near's reach (castle and town in days, woods: wood within woodsR
// tiles a share woods of them, stones within stones tiles, road: a great road within road tiles of the gate); your welcome there
// (rep). Nothing beyond your sight is revealed (the owner, 2026-11-05: "the map should not reveal what we still not discover")
const HUMBLE_START={on:true,off:.25,camp:25,wild:15,next:2,castle:2,town:[.5,3],woods:.3,woodsR:6,stones:15,road:2,rep:10,jitter:.35};
// places you must earn (doc/START_AND_GATES_DESIGN.md §2; the owner, 2026-11-05: soft locks, "all depends on situations"): on
// (the harness turns it off), by kind what opens a holding to you: renown, or honour with its realm (a castle: honour only); a
// hamlet's or a village's always. Always open: your own, your service's, your home, a holding a quest of yours takes you to, a
// pass for it (G2). Sealed by a quest: shut whatever you are (Gates.seal)
const GATES={on:true,town:{renown:10,honor:10},city:{renown:30,honor:25},castle:{honor:20},fort:{honor:10}};
// a lord's audience (the owner: "when you want to meet certain lords you may require some renown or other stats"): a great lord
// (renown great or more) hears you with renown need x his, or honour honor with his realm, or his regard rel for you, or in his
// realm's service, or on his work (a quest of his or about him)
const LORD_AUDIENCE={on:true,great:32,need:.5,honor:15,rel:20};
// the ways past a gate (G2): a letter of introduction (a reeve's or innkeeper's work done, to the nearest town or city that refuses
// you within letter tiles) or a guild token (a merchant's, a city's first); a writ bought at the gate (gold by kind; your standing
// there writ.rep at least); a bribe (gold by kind; odds base + Persuasion x pers + Trade x trade, less hard by kind (a castle's
// warden the hardest to buy); failed, caught by caught: your coin taken, honour and reputation lost, the gate barred to such ways ban
// days; else he only refuses, your coin back; one bribe a day at a gate); slipping in at night (odds by Scouting and Athletics; caught: a fine,
// a share of your gold, reputation and honour lost, barred ban days). A bribe's or a night's way in lasts the visit (a day)
// provinces (G3, world/provinces.js): on (their marks on the full map and the warning; the harness turns them off); what counts as on its land (within reach tiles of its
// holdings; a bandits' lair as lair power), its danger by their strength over yours (levels: watchful, dangerous, deadly at
// least), its words; a warning on setting out for one of warn or worse
const PROVINCE={on:true,reach:12,lair:60,levels:[.3,.8,1.6],words:['calm','watchful','dangerous','deadly'],warn:3};
const GATE_WAYS={letter:80,writ:{town:60,city:160,rep:0},bribe:{town:25,city:60,castle:120,fort:70,base:.3,pers:.05,trade:.04,hard:{town:0,city:.05,fort:.1,castle:.15},caught:.5,honor:3,rep:5,ban:3},
  slip:{base:.25,scout:.05,athl:.04,fine:.5,honor:5,rep:10,ban:3}};
// discovering places (world/discovery.js): on the switch; r tiles your band comes within a holding's edge to learn its name (the owner,
// 2026-11-11: "a bit shorter distance": 6, then 4; 2026-11-12, "still discover too easy need a bit more near holding": 2), site
// for a cave, ruins, a shrine or a hideout (3, was 4), start what a game begins knowing round you; scout: the Scouting practice a place gives;
// show: seconds its title stays over the map
// a party stalled on its way (world/stalls.js): hours still, within px, before it is sent another way; keep: how many kept to read
const WORLD_STALL={on:true,hours:12,px:16,keep:40};
// the land's borders and tint on the map (the owner, 2026-11-12: "make territory boundaries not look squared"; world/territory.js
// drawLand): on, each border a line through its tiles' edges' middles, cut at 45° where a tile stands out at a corner (a stair of tiles
// a straight slant), the tint cut the same; tint: its alpha; line: [between holdings of one realm, between realms or to the wilds],
// each [width px, alpha]; margin: tiles round the view built with it (built again once the view leaves them). on false: tile by
// tile, as before
const LAND_SMOOTH={on:true,tint:.08,line:[[1,.22],[2,.7]],margin:16};
// a holding or site learnt by name (world/discovery.js): r tiles from a holding's edge, its edge its farthest lot of core's kinds (its
// heart, houses and market: not its farms, pastures, mines, lumber camps, quarries or port, out in its fields: the owner, 2026-11-12,
// "need to be very close to the holding"); site tiles from a site; start: what a game begins near, known at once; scout: Scouting
// practice for each; show: its title's seconds on the screen
const DISCOVER={on:true,r:1,site:3,start:10,scout:6,show:4.2,core:['centre','house','nook','market']};
// how far (tiles) a site of a kind stands from every holding (world/sites.js siteSpot; the owner, 2026-11-14: "camps are not too close
// to the holding. Caves, monster lair should be more far away as well"): any (were all 6), caves 20, camps where people live 14 (a kind
// may set its own: data/encampments.js away)
/* the made worlds kept on the device (core/worldkeep.js WorldKeep): on; disk: in the browser's store too (IndexedDB db), not only the
   last one in the page; most: how many worlds the store holds, the oldest let go; v: the kept record's own shape (another v is not
   read: made again) */
const WORLD_KEEP={on:true,disk:true,v:1,most:3,db:'ashmark-worlds'};
const SITE_AWAY={any:12,cave:20,travelers:14};
// how far a site stands from the others and from a holding's lots (world/sites.js siteSpot; the owner, 2026-11-17: "sites such as stone
// pillar, abandon places, are too close to each other and even too close to the holding"): gap tiles from every other site (was 9;
// past half its tries relax of it), lots tiles from any holding's lots, its fields, farms and works too (none before: only SITE_AWAY
// from its middle, a ruin 2 tiles from a town's farms); SITE_AWAY.any 12 (was 6); own: a kind's own gap (the outlaws', deep in the
// wilds and kept from each other by their own SITE_GAP: the wider gap only cost them their wild spots; the places drawn after them keep
// theirs from them); first: kinds placed ahead of the others (the goblins' warrens want the wild land's few tiles among hills, which
// the hideouts, on wild ground first, took before them)
const SITE_SPACE={gap:14,relax:.6,lots:8,own:{hideout:9,goblins:9},first:['goblins']};
/* nothing built at a hill's edge (the owner, 2026-11-19: "Buildings should not be spawn at the edge of hills"; world/map.js edgeNear):
   a steep edge is where the land's height (its lift, ledgeHt, px) rises or falls more than steep px from one point to the next of a
   grid every step px; what is built keeps margin px of ground round its footprint free of one. A lot (lots.js lotSpot), a site
   placed in play (sites.js siteSpot, its box r px across and up: a travellers' camp its ring of tents, encampments.js) and an
   outpost (outposts.js stand) take a spot clear of one where they can (cost: how much dearer one by an edge is, in each's own score:
   lots' tiles, an outpost's tiles squared), and only where none is, one by an edge, so none is lost; a camp's tent or piece
   (campsite.js tentOk) never stands by one. A holding's middle and a bandits' camp stay where the generator puts them (worldplace.js:
   moving them re-lays the roads, bridges and realms); a bandits' camp by one moves to a spot near it
   clear of one, camp tiles at most (holding.js campOffEdge), where there is one. free: kinds of site an edge is for (a cave's mouth is in a cliff) */
const EDGE_PLACE={step:4,steep:6,margin:8,r:[16,20],cost:{lot:1000,outpost:400},camp:3,free:['cave']};
const DENSITY={
  classic:{bandits:30,camps:12,monsterStart:48,monsterCap:60,critterStart:96,critterCap:120,caravans:72,refugees:42,ships:30,
    sites:{cave:30,hideout:24,ruins:21,shrine:18,goblins:12},daily:{bandits:1,monsters:3,critters:3}},
  grow:{land:32042,holdings:37,ports:9,roads:1680,track:.5,wild:37400,
    by:{bandits:['land',.8],camps:['land',1],monsterStart:['land',1],monsterCap:['land',1],critterStart:['land',1],critterCap:['land',1],
      caravans:['holdings',1],refugees:['holdings',1],ships:['ports',1],
      sites:{cave:['land',.35],hideout:['wild',1],ruins:['land',.35],shrine:['land',.35],goblins:['wild',1]}},
    daily:{bandits:'bandits',monsters:'monsterCap',critters:'critterCap'}}
};
// a world's land: its tiles not water (a ford is water), counted once (kept off every list and hash, as WorldMap's _site)
function worldLand(m){if(m._land==null)Object.defineProperty(m,'_land',{value:m.kind.reduce((n,k)=>k===T_WATER||k===T_FORD?n:n+1,0),configurable:true});return m._land}
// a world's ports: its holdings with a port, counted once the world is in (as it first stands: a new game counts first; a port
// built or lost in play moves nothing), kept as the land is; a world not in: the base
function worldPorts(m){if(m._ports==null){if(m!==WM)return DENSITY.grow.ports;Object.defineProperty(m,'_ports',{value:TOWNS.filter(t=>bldLv(t,'port')).length,configurable:true})}return m._ports}
// a world's road (DENSITY.grow roads): the tiles of the roads between its holdings, each once, a great road's 1, a track's
// grow.track, never an estate's (lots.js estTrack: laid later, a worker's way), nor a track to a hamlet of the free folk's (its
// own folk's way, no travelled road: worldplace.js genHamlets); counted again as its roads change (none: 0)
function worldRoads(m){const R=m.roads||[],n=R.filter(r=>!r.est).length;if(m._roads&&m._roads.n===n)return m._roads.v;const w=new Map();
  const F=m.freeHoldings||[],free=name=>F.includes(name);
  for(const r of R)if(!r.est&&!free(r.a)&&!free(r.b)){const v=r.kind==='road'?1:DENSITY.grow.track;for(const i of r.path)if(!(w.get(i)>=v))w.set(i,v)}
  let v=0;for(const x of w.values())v+=x;Object.defineProperty(m,'_roads',{value:{n,v},configurable:true,writable:true});return v}
// a world's wild land (DENSITY.grow wild): its land far from every holding and road (world/sites.js wildLand, where the hideouts
// stand), the world in's; a world not in: the base
const worldWild=m=>m===WM?wildLand().n:DENSITY.grow.wild;
// a world's measures against the base's (DENSITY.grow): its land, its holdings, its ports, its road, its wild land
function worldMeasures(m){const g=DENSITY.grow;return{land:worldLand(m)/g.land,holdings:(m.settings?m.settings.holdings:g.holdings)/g.holdings,ports:worldPorts(m)/g.ports,roads:worldRoads(m)/g.roads,wild:worldWild(m)/g.wild}}
/* the counts for world m (density(WM): the world in's; a world being made: its own map). No world (none in yet, or none given):
   the base, so nothing reads the last world's by chance (the generator's camps: one world code, one world). Else each grown by
   its rule, kept on the map till a measure changes (a measure of 1, or pow 1, multiplies alone: the same in every browser) */
function density(m){const D=DENSITY,g=D.grow;if(!m)return D.classic;
  const f=worldMeasures(m),key=f.land+' '+f.holdings+' '+f.ports+' '+f.roads+' '+f.wild;if(m._dens&&m._dens.key===key)return m._dens.t;
  const one=(v,[by,pow])=>Math.round(v*(pow===1||f[by]===1?f[by]:Math.pow(f[by],pow))),t={};
  for(const k in D.classic){const v=D.classic[k];t[k]=k==='daily'?Object.fromEntries(Object.keys(v).map(s=>[s,one(v[s],g.by[g.daily[s]])])):typeof v==='object'?Object.fromEntries(Object.keys(v).map(s=>[s,one(v[s],Array.isArray(g.by[k])?g.by[k]:g.by[k][s])])):one(v,g.by[k])}
  Object.defineProperty(m,'_dens',{value:{key,t},configurable:true,writable:true});return t}
// the base: roving bands at most, and beasts at the start and at most (a world's own: density(WM); tests, the wiki)
const BANDITS=density().bandits,MONSTER_START=density().monsterStart,MONSTER_CAP=density().monsterCap;
