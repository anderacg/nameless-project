'use strict';
// World fingerprints (doc/WORLD_DESIGN.md §2.0, Step 0.0, §15.2 "Which hashes may change, and when"): eight hashes of the classic
// world (the Classic preset, the generated world a plain run makes: seed CLASSIC at Normal) and B2 (begin twice, R3, below). Each
// is printed as an INFO line (to diff a change against) and PASSed against its constant in EXPECT.
//   W1 tiles and climate (the roads already led round the centres to the gates: lots.js roadsToGates, once a map)
//   W2 DEPOSITS (every field, in order) and DEP_AT
//   W3 TOWNS as JSON after begin's initWorld: owners, garrisons, economy, estates and lots (keys starting with _ left out: caches)
//   W4 LAND (the territory: an index into TOWNS or -1, a tile; hashed a byte a tile, as it was kept before R1 made it 16-bit)
//   W5 the painted world as the game holds it after begin, every byte of worldCv()'s pixels: painted afresh after begin (its
//      useWorld forgets the title screen's picture, worldart.js), so it shows begin's lots; the suite asks for the title's first,
//      so it is the same picture whether or not that frame came before the suite, and again after the second begin (equal)
//   W6 drawWorld() at three fixed spots (where begin puts you; map pixel (1792, 1280), the middle; (2688, 768)), each by day (clock
//      .3 of a day) and by night (.8): the whole 576 x 360 view (its fog, lights, labels and minimap); the six parts are printed too
//   W7 the save string (the quick slot, its time stamp 'at' left out) once 3 days have passed since begin
//   W8 the place of every party and mover after 600 frames of updateWorld(.05): you (walking toward +96, +48 px), the lords (dead
//      ones too), bands, patrols, companions' parties, caravans, beasts, herds, refugees, workers, ships and fights
// Mode: ONE begin('soldier') a page, then every hash in turn on that game: W1-W5, W6, then W8's 600 frames, then on until 3 days
// have passed, then W7. Then begin twice (R3, the world reset: useWorld's onWorld hooks): a second begin, after those days of
// play, must make what the page's first made: W1-W4 as above, and B2, the save straight after it, equal to the save a fresh
// page makes straight after its begin (recorded at R3 by saving there in a one-off run: saving at the first begin here would
// move W7). (Before R3 it made other lots and estates: initEstates read the last game's lots, and the holdings kept what the
// last game left on them.) Each stage seeds
// Math.random itself (as battlesetup does), so the page's seed changes nothing and an unseeded run gives the hashes of -Seed 1:
// begin 9001 (both begins); each of W6's draws 9061+k, with performance.now held at 1e7 + k x 1e4 (clocks, flicker and throttles read alike);
// W8 9008 (speed 1); the days to W7 9007 (you parked off the map at -999, -999, as visual/worldsim: nothing meets you; speed 3).
// The harness's switches hold (TERRAIN, FOG, AUDIO, FIELD_SIZES... off: all battle-side; the world's fog of war is on),
// G.quietEvents is on, and the view is the tests' fixed 576 x 360. Hash: FNV-1a 32-bit over bytes, char codes or 32-bit words;
// W8's places at 1e-6 px.
// And the sums the generator makes (WM.sum: the classic world, seeds s1-s3 at Normal and s1 at Large), against SUMS.
// The notes below call W1-W8 and B2 G1-G8 and GB2: their names while the old hand-made map kept W1-W8 (its own table, EXPECT
// then, went with the map, D49: the generated world's GEXPECT is EXPECT now).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,W=t.W;
// (G1-G8, GB2 and the sums recorded 2026-10-22 in wave 3's last merge (E), on 70970ed: A's classic terrain (the hints of §8.15) and
//  B's classic anchors (the old map's 37 holdings at their places), the first generated classic world the plan holds still. From here
//  they hold, re-recorded only with a reason; at the flip (wave 4) W1-W8 took their values. W6's spots are the
//  same map pixels (where begin puts you, the classic world's Ashford; (1792, 1280); (2688, 768)), on that world)
// (G6, G7, G8 and GB2 re-recorded 2026-10-22, on purpose, the spawn fix (world.js gateSpot, tests/herowalk.js): a new game put you
//  2 tiles under your home's tile, which on the generated classic world is Ashford's house lot (83, 87): you began standing on a
//  house. Now on the open land in front of its gate, the road at (81, 87), so the first spot's pictures (G6), the march from there
//  (G8), the save after it (G7) and the save straight after begin (GB2: your place) move. Checked by putting the old spot back in
//  gateSpot with every other change of that work kept (the hero routed round water, Hurry, the encounters halved, hunger and thirst
//  on your hero, camps on clear ground): all nine as before. Was G6 fd29ebee, G7 dccc7da8, G8 dfad1cf1, GB2 bc14e9a8; G1-G5 unchanged)
// (G5, G6 re-recorded 2026-10-22, on purpose, the owner's play-test of the generated world (gfx/worldart.js, engine/worldnature.js):
//  roads led round each holding's centre into its gate over worn ground, crossings met straight on their axis and a bridge's deck
//  by a ramp, forks carried onto the way they join, fords as soft rippled shallows with scattered stones, the frost's snow blended
//  into the grass, the fen's sparse mangroves. G6 moved at the first two spots (by day and night); the third's are as before. Was
//  G5 ab5e5d34, G6 fd29ebee (parts e1e70f57 36a23691 58231b1f 228b75d3); G1-G4, G7, G8 and GB2 unchanged)
// (G6 with both: the spawn's first spot and the art's two spots: measured on the two together at the merge: fb7895ea)
// (G7 and GB2 re-recorded 2026-10-22, on purpose, for item categories (doc/ITEMS_DESIGN.md: your gear's quiver slot, P.gear.quiver,
//  in every save; no smithy makes arrows or bolts). Checked by putting both back: both as they were. Was G7 8a722172, GB2 b4f0d917; G1-G6 and G8 unchanged)
// (G5, G6 re-recorded 2026-10-22, on purpose, the owner's second play-test of the generated world (gfx/worldart.js, gfx/
//  structures.js, engine/worldnature.js): the shores curves (wpx), the water's tones shading across a climate's edge (ClimMix: the
//  blocks of the frost's water in the grass's gone) and a river's into a lake's, fords by climate (and a road's tile on a river drawn
//  as the ford it is), the estates' ground on its land (pastures fenced on their own ground, fields by climate, ragged), the trees by
//  climate (PX.WORLD_TREES: a few bare and dead), the swamp's forest a bog, the mangrove redrawn. G6 moved at all three spots by
//  day and night (5fe0477c e5ff4475 fe0c0ce6 a0764108 5a4a17b0 7a468163 to d7cc4319 7378982a 3e74611b c618bbd4 2682905c 85e4496b:
//  water, woods or estates in view at each). Was G5 4ea4e263, G6 fb7895ea; G1-G4, G7, G8 and GB2 unchanged)
// (all nine re-recorded 2026-10-22, on purpose, the owner's play-test 2 (agent K): roads come to a holding at its gate, from in front,
//  its centre and the ring beside and behind it shut to the road search, and a line's first and last legs as drawn kept off water
//  (worldplace.js placeBox, dry: a road from behind had been led round Thornbrook's centre over the river), which moves the roads'
//  tiles (G1), the deposits laid round them (G2) and the land claimed (G4); no building nor field on a road as painted (lots.js
//  roadPaint: houses had stood on the generated roads' bands), and a village short of room clearing plots in the woods after its
//  open ground, which moves the lots (G3), the painted world (G5) and the views (G6); caravans keep to the roads (Router.travel's
//  road, WAY.keep), which with the rest moves the three days (G7), the 600 frames (G8) and the save after begin (GB2). Checked: with
//  the old road builder (worldplace.js at cbc36ad) G1, G2, G4 and the sums are as before; with it, roadPaint empty and WAY.keep 1, all
//  nine are as before. Were G1 94e87250, G2 6bc88128, G3 0240c3fb, G4 ceb55e1f, G5 4ea4e263, G6 fb7895ea, G7 9517c6f9, G8 f540d98e,
//  GB2 f56d6d82)
// (G5 and G6 with both the second play-test's art (J) and its roads and lots (K): measured together at the merge: 65f440b9, 57cf6053)
// (G3, G5-G8 and GB2 re-recorded 2026-10-22, on purpose, the owner's third play-test (agent L: gfx/worldart.js, engine/worldnature.js).
//  G5, G6: the climates' edges blended as the frost's (coverOf, landRGB: the swamp's wet and the desert's dry ground laid over the
//  grass in patches thinning out, the 3-px jittered blocks between climates gone), their small things mixed across the edge
//  (PX.worldNatureMix), a wood's fringe of undergrowth and trees (PX.WN_FRINGE), fords as real ones (the bed showing through the
//  shallows, ripples, rocks scattered, a track up each bank, reeds and ice by climate); G6 moved at all three spots by day and night
//  (to abd942ff 657754a3 a16ddcae a37cb05d 68c9f1ec b80d326c). G3 and with it G7, G8 and GB2: the roads' art meeting agent K's
//  roads, which lots.js roadPaint reads (artRoadMarks): a fork's end carried up to GENART.join 2 tiles (was .75) onto the way it
//  joins, a road turning back off a bridge running the whole lead out first, a road leaving a ford sideways starting in its
//  shallows (offDeck), so a few lots and fields stand otherwise. Checked: with those three as before (join .75, no turn-back lead,
//  offDeck as before) G3, G7, G8 and GB2 are as before (G5 294ab9d0, G6 7c2e1e64: the art). Was G3 a3673959, G5 65f440b9, G6
//  57cf6053, G7 9d580ef9, G8 0f487dba, GB2 dc1b8829; G1, G2, G4 and the sums unchanged)
// (all nine re-recorded 2026-10-22, on purpose, the owner's play-test 3 (agent M): each holding's rivers crossed near it, by a bridge
//  (worldplace.js placeHoldXing), and every bridge on the roads (a track from each end no road takes, to the nearest road on its bank;
//  a bridge no road reaches taken up), which moves the tiles (G1), the deposits laid round them (G2) and the land claimed (G4);
//  every lot and field on ground its holding's people walk to from its gate, not far round, its own bank first, never by a crossing's
//  end, a port town's harbour before its houses (lots.js lotWalk, lotWalks), which moves the lots (G3), the painted world (G5) and the
//  views (G6); with the rest the three days (G7), the 600 frames (G8) and the save after begin (GB2). Checked: with the holdings'
//  crossings and the bridges' tracks off, lots.js's walk, bank, far-round and harbour rules off, folk.js's DELIVER.grace 0 and
//  router.js's river legs as they were, all nine are as before. Were G1 81ce84b1, G2 5df96192, G3 a3673959, G4 3ffcfb90, G5
//  65f440b9, G6 57cf6053, G7 9d580ef9, G8 0f487dba, GB2 dc1b8829)
// (G3, G5-G8 and GB2 measured together 2026-10-22 at the merge of agents L (the art, above) and M (the crossings and lots, above):
//  each moved them alone, and together they give these; G1, G2, G4 are M's alone, the sums M's alone)
// (G3, G5-G8 and GB2 measured together 2026-10-22 at the merge of agent N (the fourth play-test's art, below) with L and M, and
//  N's follow-up there, M's tracks from a bridge's end (worldplace.js) met by the art: a line's end at a bridge's end no longer
//  carried onto another line nearby (joinEnds), a line turning back off a bridge led GENART.back 1.6 tiles out first (straightOn,
//  clear of the ramp), reeds kept off the water (a reed's head too). The first two move the painted
//  roads lots.js reads (artRoadMarks), so G3 and with it G7, G8 and GB2; checked: with those two as before (no bridge-end rule,
//  back .9) G3 5cee7bef, G7 7270d6c2, G8 8186ed74 and GB2 7149936a are as before, and with all three as before G5 ea4cd87b and
//  G6 08e9011b, the merge's own. Were G3 5cee7bef, G5 ea9098d7, G6 92c96e76, G7 7270d6c2, G8 8186ed74, GB2 7149936a; G1, G2, G4
//  and the sums unchanged)
// (all nine measured together 2026-10-22 at the merge of agent O (big climates: genClimTidy, the brooks' check; the holdings' spread:
//  PLACE.capMin, space, room, pull, a port at least) with agent M's follow-up on O's worlds (a holding's ferry only on a navigable
//  river, a track starting at a bridge's end where no lead fits, crossings re-priced and kept apart (PLACE.apart), no looping track,
//  the realms' land estimated with their bridges (placeHoldBridged), no far-round estate on a generated world) and N's art; O and M
//  each showed their rules off give the values before. Were G1 02a441ce, G2 500a5428, G3 d07ea9fc, G4 f81e1c01, G5 656f8bc9, G6
//  5794be9d, G7 c57a6cd8, G8 c613950a, GB2 c1a02414)
// (G3, G5, G7, G8 and GB2 re-recorded 2026-10-22, on purpose (agent Q, the merge's sweep: sprites -Gen, roads not kept clear): on O's
//  and M's world 14 tracks (worldplace.js) end on a bridge's deck with the middle of the bridge's end tile the point before, so
//  offDeck left a leg of no length there and straightOn made NaN of it: some 11 of each one's segments by the bridge were neither painted
//  nor kept clear, so lots.js (artRoadMarks) built on the road's way (Deepdelve's farm, market, mine and smithy; Redspire's lumber
//  camp, which finds no other spot now: 502 lots, was 503). offDeck drops that point (gfx/worldart.js). Checked: with that one line
//  out all nine are as before, the faster painting in (G5, G6 the same pixels). Were G3 6459947c, G5 b2110840, G7 c36d41d1, G8
//  aa0f12ac, GB2 bac70e4f; G1, G2, G4, G6 and the sums unchanged)
// (G5, G6 re-recorded 2026-10-22, on purpose, the owner's fifth play-test (agent T: gfx/worldart.js, engine/worldnature.js, world/
//  fog.js, gfx/mist.js): a road or a ford's track through a wood a wood's tile (the floor up to the path, trees beside it, PX.WN_LANE;
//  the path narrower and wandering, GENART.wood), the ford's shallows an S-bent ragged bar (GENART.ford), a road over the hills rising
//  with them and a rise's cast shadow soft (PX.WN_HILL), the mountains in kinds (PX.WORLD_MOUNTS), brooks not cut short by the art
//  (over clear ground, into and out of the water as drawn, beside a road they run along), nothing toned on water as drawn, and the
//  fog's edges a pale haze (G6 only). The painted world is all that moves: G1-G4, G7, G8 and GB2 as before. Checked: on the art
//  files as at f538fa7 both as before. Were G5 6d0f211d, G6 a8996932)
// (G6, G7, G8 and GB2 re-recorded 2026-10-22, on purpose (agent U, play-test 5: wild things grow with the world, data/world.js
//  DENSITY.grow): the generated classic seed, 3.19 times the old map's land, now holds its land's bands, beasts, game and sites
//  (76 bands, 153 / 191 beasts, 306 / 382 game) where it held the old map's, so more of them are drawn in the views (G6), they and
//  the draws spawning them move what moves (G8), and the saves hold them (G7, GB2); and a generated world packs its beasts', game's
//  and bands' records in a save (worldobject.js packRec: G7, GB2). Checked: with the classic seed at the old map's counts all but G7 and
//  GB2 are as before; with the packing off too, all nine are. W1-W8 and the sums unchanged. Were G6 a8996932, G7 6f3a5d30, G8
//  5d18c925, GB2 0f363bb3)
// (G6 measured together 2026-10-22 at the merge of agent T's art and agent U's wild things (both above): each moved it alone;
//  G7, G8 and GB2 are U's alone)
// (all nine re-recorded 2026-10-22, on purpose, the layout batch of play-tests 4 and 5 (agent S): a holding in the woods gets a
//  clearing as stage 8 begins (worldplace.js placeClear: forest to open ground, so G1's tiles, G2's deposits on them, G4's land
//  and everything after move); each outer estate no way comes near gets a track through the woods (lots.js estTrack: road tiles,
//  G1; the painted world, G5, G6; the land reckoned over them, G4); an outer estate with no room near looks out farther (LOT_FAR:
//  G3's lots); the workers keep to the roads and tracks (router.js WAY.folk: G7, G8, GB2). Checked: with placeClear, estTrack,
//  LOT_FAR's farther look, PLACE.regrow (1) and the workers' way off, the rest of the work in (the way graph charted again with
//  every road's ends, the land reckoned again, the capitals' liking as chosen, ponds and oases), all nine and the five sums are
//  as before; with placeClear alone off the sums and G2 are. Were G1 67bc5b4e, G2 1d53b207, G3 1efc5bb1, G4 1fb76c87, G5 6d0f211d,
//  G6 a8996932, G7 6f3a5d30, G8 5d18c925, GB2 0f363bb3)
// (all nine re-recorded 2026-10-22, on purpose, the owner's fifth play-test (agent R: the desert's water, springs, ponds and oases,
//  worldgen.js GEN_RIVER.desert, the new stage 5b genPonds, GEN_POND, GEN_OASIS): no rain on the desert's land and the drainage
//  rising into it move every river and brook of the classic world (G1), then the springs, ponds and oases laid as lake water, and
//  with them what reads the land: the deposits (G2), the holdings' lots (G3), the land claimed (G4), the painted world (G5), the
//  third view by day and night (G6: 61733260 4c2dfbbf 44b42095 5a88bca7 6f4fc957 ec38b3f9 to 906f71f7 621ba274 08e865a5 98f9c6ca
//  5658f362 798547ee), the three days (G7), the 600 frames (G8) and the save after begin (GB2). Checked: with those rules off (the
//  desert's rain counted, no rise, no terminal lake, no desert brook cut, stage 5b laying nothing, stage 10 cutting nothing) all
//  nine are as before; the navigable fix that came with it (a narrower river's rapids never clear a wider river's tiles) moves none
//  of them. Were G1 67bc5b4e, G2 1d53b207, G3 1efc5bb1, G4 1fb76c87, G5 6d0f211d, G6 a8996932, G7 6f3a5d30, G8 5d18c925, GB2 0f363bb3)
// (all nine measured together 2026-10-22 at the merge of agents S and R (each proved its own rules off above), with S's merge
//  fixes: no road's corner tile in a holding's ring, no crossing to a lone tile of land in a river (worldplace.js PLACE_HOLD.pocket))
// (all nine measured together 2026-10-22 at the merge of agents R (the generator's water: no desert rain, terminal lakes, springs, ponds and oases), S (estate tracks, forest clearings, estates farther out, oases drawing holdings, stage 7 regrown, roads round ponds) and U (the camps grown with the land, port piers preferring the sea) on main 880b6e7; each agent proved its own rules off give the values before)
// (G1, G4, G5 and G7 re-recorded 2026-10-22, on purpose (agent U, the -Gen sweep's resources check): an estate's track (lots.js
//  estTrack) was laid over an ore vein (Scorchwell's silver at 418,175 became a track tile); it keeps off the veins and fishing
//  grounds now (DEP_AT), so that track takes another line: the tiles (G1), the land claimed (G4), the painted world (G5) and the
//  save (G7). Checked: with that one condition out all nine are as before. Were G1 a1703670, G4 dd05f02b, G5 212e5174, G7 f39c5b43)
// (G5 re-recorded 2026-10-22, on purpose, the owner's notes on the fifth play-test's mountains (agent Y, engine/worldnature.js): each
//  range's kind drawn from its climates' pools (PX.WN_MOUNT.pool: the original look, the climate's own rock, kept as a kind of its own
//  beside the new ones), a forested range wooded with the world's trees standing on its slopes over a wood's floor (PX.WN_MOUNT.trees),
//  a range's look, trees and foot blended across a climate's edge by the covers (PX.WN_MOUNT.blend, foot). Only the ranges move: G6's
//  spots show none, so G6 and every other hash are as before. Checked: with engine/worldnature.js as at 880b6e7 G5 is as before.
//  Was G5 cdc20759)
// (G5 measured together 2026-10-22 at the merge of agent Y's mountains (real trees on forested ranges, a variety pool keeping the
//  original look, blends across climate borders: engine/worldnature.js) with eb6d89c; with main's worldnature.js G5 is as before)
// (W5, W6 re-recorded 2026-10-22, on purpose, the owner's art notes (agent AR, engine/worldnature.js): a group of hill tiles one
//  broad rise, not a small bump a tile (PX.WN_HILL: the pale blobs of his shot 68), and every wood tile a full stand at its edge, in
//  a small wood, by a road or a shore (PX.WN_WOOD; a leafy tree in the snow on a wood's tile a conifer, PX.WN_ECO.wood). Only the
//  painted world moves: W5, and W6 at all three spots by day and night (d6412570 c5a348cd 24520d5c b7e62338 1876cadd 34c366f6 to
//  c29e3aa3 5cf3c4df df275481 d22adbbe 294ecfac 50d051a5). Checked: with engine/worldnature.js as at 20882af W5 and W6 are as
//  before (gfx/worldart.js's farmPlot draws nothing until gfx/structures.js estateGround calls it: with that line W6 would be
//  acf0a308, the farms at the first two spots). Were W5 3d1b7695, W6 8c6b32ad; W1-W4, W7, W8 and B2 unchanged)
// (W6 re-recorded 2026-10-23 at AR's merge: with gfx/structures.js estateGround drawing farm plots by farmPlot (crops in rows) the
//  first two spots' farms show their crops; with the old furrows put back W6 is 494e07e1, AR's own value)
// (all nine re-recorded 2026-10-23, on purpose, the owner's play-test of 2026-10-22 (agent GP): the land's small patches tidied (worldgen.js genPatchTidy, GEN_PATCH),
//  the brooks through the holdings cut back (genHoldBrooks), the centres on dry ground (worldplace.js placeDry), ports only on harbour
//  water and the League liking it (portWater, PLACE_PORT; PLACE.regrow 5), piers and lots kept off ponds and brooks and the estate
//  tracks' painted lines off the fields (lots.js pierOk, brookAt, softClear), the sites' counts (data/world.js DENSITY.grow: caves,
//  ruins and shrines ^.35, hideouts ^.8, the travellers by the road) and the travellers' spacing and roadside draw (sites.js SITE_GAP,
//  TravellersCamp.pick), a dock on its pier's own water (ships.js dockOf): the classic world's kinds
//  (W1: tiles tidied, holdings and roads with them), the deposits on them (W2), the holdings' lots and estates (W3), the land claimed
//  (W4), the painted world (W5, W6), the sites and what follows (W7, W8: fewer travellers' camps, caves, ruins and shrines; the ships
//  from their docks) and the save after begin (B2). Checked: with every one of those rules off (GEN_PATCH.min 0, no brook cut,
//  placeDry, the old port rule (the open sea or a navigable river, the League by any lake), PLACE.regrow 3, no pier or brook rule,
//  no softClear, DENSITY's sites by the land at 1, no SITE_GAP, the travellers drawn anywhere, the old dockOf) all nine are as before.
//  Were W1 5ae838ac, W2 2fb848a2, W3 19419885, W4 9996d93d, W5 3d1b7695, W6 8c6b32ad, W7 62657eba, W8 e85c68b0, B2 7aad116d)
// (W5 and W6 measured together 2026-10-23 at the merge of GP's generator and placement with AR's hills, woods and crops; the
//  others are GP's alone)
// (W5 and W6 re-recorded 2026-10-23, on purpose (agent PB): a pond's and an oasis's bank lit with the ground's grain and dappled a
//  pixel at a time (worldart.js pgr, GENART.pgrain), and a pond's ring mottled at its water too (engine/worldnature.js
//  PX.WN_RING.soft): no straight run of one bank colour along a tile's edge. Only the painted world moves; checked: with the old
//  code back both are as before. Were W5 f6daaf45, W6 89ee63a7)
// (W1-W8 and B2 re-recorded 2026-10-23, on purpose, the building redesign's stage 3 (agent S3: lots.js, structures.js, worldart.js):
//  every building a model at the owner's scale, the towns laid out again with them. A village clears 110 tiles of woods (worldplace.js
//  PLACE_CLEAR, was 80) and its kinds and deposits with it (W1, W2); the centres 64 and 128 px, the roads led round them to their
//  gates, the houses 32 px, the estates 32 or 64, laid by the centre's middle, and their tracks (W1, W3, W4); the yards painted into
//  the land, the roads cut round the bigger centres (worldart.js cutThrough, gateLead's corners) (W5); the models drawn (W6); the
//  sites placed round the new lots (ruins kept off roads: sites.js Ruins.clear) and begin's draws with them, so what follows (W7, W8,
//  B2). Checked: with PLACE_CLEAR's village back at 80 and the centres at their old sizes, W2 and the five sums are as before; the
//  rest is the new layout and art throughout. Were W1 92f3e9c6, W2 9d9df44b, W3 d123d890, W4 9c23c683, W5 f6daaf45, W6 89ee63a7,
//  W7 bc579d54, W8 4fa9c9cb, B2 d90ef30c)
// (W5 and W6 measured together 2026-10-23 at the merge of stage 3 (S3: the towns' models and yards) with PB's pond banks)
// (W7 and W8 re-recorded 2026-10-23, on purpose, the owner's road notes (agent RB: world/roadband.js): a road's speed follows the road as
//  drawn (within 10 px of a great road's line, 8 of a track's, blended to the land's over 6 px more; an estate's track 1.15, not 1.3),
//  read by map.js speedAt for every party, caravan, refugee and beast, and a rider on the road's band not on rough ground (world.js
//  roughFor), so what moves in the 600 frames (W8) and the three days and their save (W7) move. The painted world (W5, W6) and the
//  save after begin (B2) hold. Checked: with ROAD_BAND's widths 0 (no band: the tile rule, an estate's track's tile 1.3) all nine are
//  as before. Were W7 7521bda3, W8 32682fb8)
// (W6, W7, W8 and B2 re-recorded 2026-10-23, on purpose, the owner's hideouts deep in the wilds (agent HO: world/sites.js
//  HIDEOUT_PLACE, HIDEOUT_BAND; data/world.js DENSITY.grow wild): 30 hideouts by the wild land (was 61 by the land), 22 tiles or
//  more from every holding and 8 from every road, 20 apart, drawn from the wild land and its clearings, so begin's draws for its
//  sites, and with them the bands and beasts placed after them, move: the third view by day and night (W6: e7c695bb b3a84845 to
//  19091725 ba5f5d14, the first two as before), the 600 frames (W8), the three days and their save (W7) and the save after begin
//  (B2); their bigger chieftains (levels 2-5, were 1-3) move the saves on their own (W7, B2). Checked: with every rule off (the old
//  ground, Site pick, SITE_GAP's hideout {travelers: 16}, DENSITY's hideouts by the land at .8, the den's row as the ruin's) all
//  nine are as before; with only the placement and the count off, W7 and B2 move (05614c15, 144fcc6d: the chieftains) and the
//  rest hold. Were W6 3c66cfdf, W7 3be1d2fa, W8 9323078a, B2 af5eb3da)
// (W5, W6 re-recorded 2026-10-23, on purpose, the owner's play-test (a square of bare sand round a hut by an oasis): the green
//  round an oasis or a pond (engine/worldnature.js PX.WN_RING) now runs on under clear ground, toned, so a holding's yard over it
//  takes its colour; its palms and tufts still keep off. Only the painted world moves; W1-W4, W7, W8 and B2 unchanged. Were W5
//  b11af87c, W6 8157cbb7)
// (W1, W3-W8 and B2 re-recorded 2026-10-23, on purpose, workplaces where they make sense (agent EW: data/economy.js ESTATE_LAND,
//  lots.js landFits and rockYaw, resources.js resOut, data/critters.js PASTURE_HERD; tests/workplaces.js): a mine only at the rock
//  by its land's ore (15 on the classic world, now 6), a quarry at the rock, a lumber camp in real woods, a farm on fertile ground,
//  a mine's and a quarry's back to the rock, so the holdings' estates and lots (W3), the estates' tracks laid on the tiles (W1) and
//  the land reckoned along them (W4), the painted world (W5) and its views (W6, all six parts: aea09d60 323c4da9 4c7d8e02 5a7027b0
//  b0cc9ffe fc5b002c), the workers and the pastures' herds of their land's animals (W8), and the saves (W7, B2) move; W2, the
//  deposits, holds. Checked: with the new rules off (ESTATE_LAND as the old rules: a lumber camp 2 wooded tiles, a mine or quarry 1
//  tile at the rock, no ore near, no fertile ground, no facing; resOut's iron and copper from nothing; the pasture's herd its people's
//  first grazer) all nine are as before. Were W1 47419c85, W3 154e87e1, W4 8e6f8677, W5 9dbdfd42, W6 1c8e6188, W7 83187faa,
//  W8 cb53c8cb, B2 06f1b51d)
const EXPECT={W1:'2ba57e1b',W2:'975f62a1',W3:'224e40e8',W4:'29fda26b',W5:'f284901d',W6:'b5185fc6',W7:'343f89d9',W8:'f10260e8',B2:'c1a2ab6a'};
// (G5, G6 re-recorded 2026-10-22, on purpose, the owner's fourth play-test (agent N: gfx/worldart.js, engine/worldnature.js): the
//  grass's hills shaded lighter (what read as swamp) and running on under the roads, their palette and a wood's floor by the
//  climates' covers (PX.WN_BLEND), the trees across a climate's edge an ecotone (PX.WN_ECO, ecoLean), a road's colour blended
//  across it (roadPal), brooks crossing roads (PX.WN_XING), a bridge's abutments no wider than its deck, the shore's sand or mud by
//  the nearest water that is no bridge's, worn ground, bank stones and trees never on the water as drawn. G6 moved at all three
//  spots by day and night (to 5b3cd6fd 7a7efab9 a746a887 77d5c809 1c7f7e1b ccf23d61). Checked: with those two files as at f97112f
//  G5 and G6 are as before. Was G5 00f1be5d, G6 7c2e1e64; G1-G4, G7, G8, GB2 and the sums unchanged)
// (all nine re-recorded 2026-10-22, on purpose, the owner's fourth play-test (agent O: "ensure that the biomes are big enough"):
//  stage 3 smooths the temperature and the low ground before its cuts and then tidies the climates (worldgen.js GEN_CLIMATE blur,
//  strip, minArea; genClimTidy: no strip, no 1-tile neck, no piece under 400 tiles but an isle's or a classic holding's home), so
//  the classic world's climates move (G1), and with them what reads them: the deposits (G2), the forests, the holdings' notes,
//  prices and lots (G3), the land claimed (G4), the painted world (G5), the third view by day and night (G6: 68c9f1ec b80d326c to
//  3d988fcc 1e801a73; the first two as before), the three days (G7), the 600 frames (G8) and the save after begin (GB2).
//  Checked: with the tidying off (GEN_CLIMATE blur n 0 and low [2, 0], strip 0, minArea 0) all nine are as before; the rivers'
//  new rule (every brook ends in water: genRiverCheck) moves nothing, no world needing a retry for it. Were G1 81ce84b1, G2
//  5df96192, G3 ca3464b3, G4 3ffcfb90, G5 00f1be5d, G6 7c2e1e64, G7 e73ec214, G8 7afe2f79, GB2 65d5ff21)
// (the random presets' sums re-recorded 2026-10-22, on purpose, Phase 2b: the owner's "the holdings seem a bit too much": Normal
//  27 holdings by default (was 37), Large 40 (was 55), so their settings (in the sum) and placement change; with them two clamps
//  of stage 7 the fewer holdings needed (worldplace.js): a port only on the open sea (placeOpen: a strait a road bridged had left
//  Normal s1's Fernmere on a lake) and each realm's land within 24% of the mean as placed (PLACE.even; the roads moved Normal
//  redwater's to 38%). Checked by putting back 37 / 55 holdings, the old port rule and 30% at stage 7: all four as before, and the
//  classic world unchanged throughout. Were Normal s1 128cfb7e, s2 2b581da4, s3 c38ac906, Large s1 5af09941)
// (all five re-recorded 2026-10-22, on purpose, the owner's play-test 2 (agent K): the road builder's new rule (roads in at the gate,
//  from in front; lines' end legs kept off water: G1 above). Checked: with worldplace.js as at cbc36ad all five as before. Were
//  classic 7333836c, Normal s1 103bc267, s2 bf4d8d77, s3 23d160c1, Large s1 ab0227f1)
// (all five re-recorded 2026-10-22, on purpose, the owner's fourth play-test (agent O): the climates tidied (GEN_CLIMATE: G1-G8
//  above), the climate layer of every generated world, and what follows it. Checked the same way: with the tidying off all five
//  as before. Were classic e9ff637f, Normal s1 edfd56e4, s2 fdb0fae4, s3 28976823, Large s1 7df7120f)
// (all five re-recorded 2026-10-22, on purpose, the owner's play-test 3 (agent M): the holdings' crossings and the bridges' tracks
//  (G1 above). Checked: with both off and router.js's river legs as they were all five as before. Were classic e9ff637f, Normal s1
//  edfd56e4, s2 fdb0fae4, s3 28976823, Large s1 7df7120f)
// (all five measured together 2026-10-22 at the merge of agents O and M (G1 above). Were classic 2eb1e165, Normal s1 d934ba19, s2
//  bd7c17d3, s3 746d0808, Large s1 0f0a9fa1)
// (all five re-recorded 2026-10-22, on purpose, the clearings of agent S (worldplace.js placeClear: a holding in the woods, forest
//  opened round it as stage 8 begins, so the kind layer moves). Checked: with placeClear off all five as before. Were classic
//  e9407a0b, Normal s1 d3fe6e28, s2 db154067, s3 5d075e09, Large s1 631760e5)
// (all five re-recorded 2026-10-22, on purpose, the owner's fifth play-test (agent R: G1 above): every generated world's rivers,
//  brooks, terminal lakes, springs, ponds and oases, and what placement makes of them. Checked the same way: with those rules off
//  all five as before, the navigable fix moving none. Were classic e9407a0b, Normal s1 d3fe6e28, s2 db154067, s3 5d075e09, Large
//  s1 631760e5)
// (all five measured together 2026-10-22 at the merge of agents S and R, as G1-G8 above)
// (all five measured together 2026-10-22 at the merge of agents R (the generator's water: no desert rain, terminal lakes, springs, ponds and oases), S (estate tracks, forest clearings, estates farther out, oases drawing holdings, stage 7 regrown, roads round ponds) and U (the camps grown with the land, port piers preferring the sea) on main 880b6e7; each agent proved its own rules off give the values before)
// (all five re-recorded 2026-10-23, on purpose, the owner's play-test of 2026-10-22 (agent GP, W1-W8 above): every generated
//  world's kinds tidied, its brooks cut back from the holdings, its centres on dry ground and its ports on harbour water. Checked the
//  same way: with those rules off all five as before. Were classic f9503f0b, Normal s1 1909f780, s2 f9df3b16, s3 0eb8d0bf, Large s1
//  4e80c5cb)
// (classic and Normal s1-s3 re-recorded 2026-10-23, on purpose, stage 3 of the building redesign (W1-W8 above): a village's clearing
//  of 110 tiles (PLACE_CLEAR, was 80) for its 64 px centre. Checked: with it back at 80 all five as before (Large s1 never moved).
//  Were classic efa9e400, Normal s1 f9e8cbcf, s2 be89157c, s3 5d829885)
const SUMS={classic:'91df174b','Normal s1':'ce4bf2b8','Normal s2':'f73a2073','Normal s3':'3c444fc8','Large s1':'c0456394'};
const r0=Math.random,pn=performance.now,t0=pn.call(performance);
try{
 try{localStorage.clear()}catch(e){}
 const fnv=()=>{let h=2166136261;const H={
   b(a){for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619)>>>0;return H},// bytes, or 32-bit words (a Uint32Array)
   s(x){x=String(x);for(let i=0;i<x.length;i++)h=Math.imul(h^x.charCodeAt(i),16777619)>>>0;return H},
   n(v){h=Math.imul(h^(Math.round(v*1e6)|0),16777619)>>>0;h=Math.imul(h^(Math.round(v)|0),16777619)>>>0;return H},
   get x(){return h.toString(16).padStart(8,'0')}};return H};
 const bytes=a=>new Uint8Array(a.buffer,a.byteOffset,a.byteLength),words=a=>new Uint32Array(a.buffer,a.byteOffset,a.byteLength>>2);
 const got={},lines={},check=(id,h,what)=>{got[id]=h;lines[id]=id+' '+h+' '+what},seed=n=>{Math.random=t.seeded(n)};
 // ---- the game: one begin (the world's picture made first, as the title screen makes it)
 t.worldCv();seed(9001);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();const d0=G.day;
 // W1-W4: the world begin leaves (asked again after the second begin)
 const world=()=>{const h={};
  h.W1=[fnv().b(t.tiles).b(t.climate).x,'tiles and climate ('+t.MW+'x'+t.MH+')'];
  {const x=fnv();for(const d of t.DEPOSITS)x.s(JSON.stringify(d));x.b(bytes(t.DEP_AT));h.W2=[x.x,'DEPOSITS ('+t.DEPOSITS.length+') and DEP_AT']}
  {const s=JSON.stringify(t.TOWNS,(k,v)=>k[0]==='_'?undefined:v);h.W3=[fnv().s(s).x,'TOWNS as JSON ('+t.TOWNS.length+' holdings, '+t.TOWNS.reduce((a,z)=>a+(z.lots||[]).length,0)+' lots, '+s.length+' chars)']}
  // (LAND a byte a tile: TOWNS is far under 128 long, so its 16-bit values are the bytes it had)
  {t.landFresh();const L=t.LAND;h.W4=[fnv().b(bytes(Int8Array.from(L))).x,'LAND ('+L.filter(v=>v>=0).length+' tiles claimed)']}
  return h};
 // the save (the quick slot, its time stamp left out)
 const save=()=>{t.saveGame(true,'quick');const raw=localStorage.getItem(t.SAVE+'.quick'),sv=raw&&JSON.parse(raw);if(sv)delete sv.at;try{localStorage.removeItem(t.SAVE+'.quick')}catch(e){}return sv?JSON.stringify(sv):''};
 const w1=world();for(const id in w1)check(id,w1[id][0],w1[id][1]);
 const paint=()=>{const c=t.worldCv();return [fnv().b(words(c.getContext('2d').getImageData(0,0,c.width,c.height).data)).x,c.width+'x'+c.height]};
 {const [h,wh]=paint();check('W5',h,'the painted world ('+wh+')')}
 // ---- W6: three spots, by day and by night
 {const spots=[[P.x,P.y],[1792,1280],[2688,768]],keep={x:P.x,y:P.y,clock:G.clock},parts=[],h=fnv();let k=0,now=1e7;
  performance.now=()=>now;
  for(const [x,y] of spots)for(const day of [.3,.8]){P.x=x;P.y=y;P.tx=P.ty=null;G.chase=null;G.clock=day*t.DAY;seed(9061+k);now=1e7+k*1e4;
   t.drawWorld();const p=fnv().b(words(t.ctx.getImageData(0,0,t.VW,t.VH).data)).x;parts.push(p);h.s(p);k++}
  performance.now=pn;P.x=keep.x;P.y=keep.y;G.clock=keep.clock;
  check('W6',h.x,'drawWorld at 3 spots by day and night ('+t.VW+'x'+t.VH+': '+parts.join(' ')+')')}
 // ---- W8: 600 frames, you on the move
 {seed(9008);t.setSpeed(1);P.tx=P.x+96;P.ty=P.y+48;for(let f=0;f<600;f++)t.updateWorld(.05);
  const h=fnv().n(P.x).n(P.y),n=[],lists={lords:W.lords,bands:t.bandits,patrols:W.patrols,comps:t.cparties(),caravans:W.caravans,monsters:W.monsters,
   critters:W.critters,refugees:W.refugees,folk:W.folk,ships:W.ships,fights:W.fights};
  for(const k in lists){const L=lists[k]||[];h.s(k).n(L.length);for(const q of L)h.n(q.x).n(q.y);n.push(k+' '+L.length)}
  check('W8',h.x,'every party\'s place after 600 frames (you at '+P.x.toFixed(1)+','+P.y.toFixed(1)+', mode '+G.mode+'; '+n.join(', ')+')')}
 // ---- W7: on until 3 days have passed, then the save
 {seed(9007);P.x=-999;P.y=-999;P.tx=P.ty=null;G.chase=null;t.setSpeed(3);let f=0;
  for(;f<4000&&G.day<d0+3;f++)t.updateWorld(.05);
  const mode=G.mode;G.mode='world';const s=save();
  check('W7',fnv().s(s).x,'the save once 3 days have passed (day '+G.day+', '+f+' more frames, mode '+mode+', '+s.length+' chars)')}
 // ---- begin twice: the same world and the same game as the first begin, a fresh page's
 {seed(9001);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
  const w2=world(),s=save(),diff=Object.keys(w1).filter(id=>w2[id][0]!==w1[id][0]),p2=paint()[0];
  ok(p2===got.W5,'begin twice: the second paints the world as the first did (W5'+(p2===got.W5?'':'; differs: '+p2)+')');
  ok(!diff.length,'begin twice: the second makes the world the first made (W1-W4'+(diff.length?'; differ: '+diff.map(id=>id+' '+w2[id][0]).join(', '):'')+')');
  check('B2',fnv().s(s).x,'begin twice: the save straight after the second begin, as a fresh page makes it ('+s.length+' chars)')}
 // (W1-W8 and B2, against EXPECT)
 for(const id in EXPECT)if(lines[id])info(lines[id]);
 for(const id in EXPECT)if(EXPECT[id])ok(got[id]===EXPECT[id],id+' equals the baseline ('+got[id]+(got[id]===EXPECT[id]?'':'; baseline '+EXPECT[id])+')');
  else o.push('FAIL '+id+' has no baseline ('+got[id]+')');
 // ---- the generator's sums: the classic world, seeds s1-s3 at Normal, s1 at Large
 {const S={classic:t.classicSettings(),'Normal s1':{preset:'normal',seed:'s1'},'Normal s2':{preset:'normal',seed:'s2'},'Normal s3':{preset:'normal',seed:'s3'},'Large s1':{preset:'large',seed:'s1'}};
  for(const k in SUMS){const h=t.genWorld(S[k]).map.sum.toString(16).padStart(8,'0');info('sum '+k+' '+h);if(SUMS[k])ok(h===SUMS[k],'the sum the generator makes, '+k+', equals the baseline ('+h+(h===SUMS[k]?'':'; baseline '+SUMS[k])+')');else o.push('FAIL sum '+k+' has no baseline ('+h+')')}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{Math.random=r0;performance.now=pn}
info('took '+((pn.call(performance)-t0)/1000).toFixed(1)+' s');
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
