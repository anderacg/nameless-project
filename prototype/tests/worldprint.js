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
// (W7 re-recorded 2026-10-23, on purpose, the owner's tracks (agent TR: world/tracks.js, data/tracks.js TRACKS): every band that
//  moves leaves a trail of points, saved under the world part's new key tracks (after band), so the save once 3 days have passed
//  holds the three days' trails (222,145 chars to 286,137, near the cap of 4,000 points). Sampling draws no Math.random and moves
//  nothing (W8 holds); begin leaves none (B2 holds); none are drawn in W6's views (none walked yet). Checked: with TRACKS.on false all
//  nine are as before. Was W7 343f89d9)
// (W7, W8 re-recorded 2026-10-23, on purpose, the owner's straight ways (agent PS: world/router.js WAY_SMOOTH, waySmooth,
//  wayStraight, wayGo; tests/straightways.js): every walker's way by the router is pulled straight (no staircase from tile middle
//  to tile middle; a road keeper's kept to its road; one pushed off its way finds it again), its legs over the land run on
//  together, a tile made for reached to WAY_SMOOTH.at px (was 3), a last stretch walked straight only when clear of every closed
//  tile, so where the lords, bands, patrols and workers are after the 600 frames (W8) and after three days, with the save then
//  (W7), move. The worlds (W1-W4), the painted world and its views (W5, W6) and the
//  save after begin (B2) hold; the battle suites, aishare and rts -Seed 1,2,44 hold. Checked: with WAY_SMOOTH.on false all nine are
//  as before. Were W7 343f89d9, W8 f10260e8)
// (W7 at the merge of the two above, 2026-10-23: the tracks' trails of the straightened walkers, both together: 5cf2a467 (tracks alone
//  91744a78, the straight ways alone 7d1fc458))
// (W7 re-recorded 2026-10-23, on purpose, the owner's tracks on roads (agent TR2: world/tracks.js trackRoad, trackSpot; data/tracks.js
//  TRACKS.road): the roads and the estates' tracks keep prints now (fainter, shorter-lived), so a trail runs on over a road instead
//  of ending there, and the save's tracks once 3 days have passed move (W7: fewer, longer trails within the same 4,000-point cap).
//  Nothing else reads them: W1-W6, W8 and B2 hold (W6's views draw no prints: none walked yet). The prints drawn from the kept points
//  only (gfx/tracks.js, the turning prints' fix) move no fingerprint. Checked: with TRACKS.road.ground 0 (no prints on roads) all
//  nine are as before. Was W7 5cf2a467)
// (W7, B2 re-recorded 2026-10-23, on purpose, the owner: a new band sets out in high spirits, morale 100 (core/state.js; was 80),
//  then drifts toward its troops' own as before. Only the saves move (P.morale); W1-W6, W8 and the battle suites hold. Were W7
//  4b9a64dd, B2 c1a2ab6a)
// (W7, B2 re-recorded 2026-10-23, on purpose, the owner's chronicle (agent CH: core/save.js, the save piece 'chronicle'): every
//  message is kept and saved with the game, as [day, m, cls, kind, ref], so both saves hold the messages logged so far (W7: the
//  three days', B2: the welcome after begin). Nothing else moves: W1-W6, W8 and the battle suites hold. Checked: with the piece's
//  save off (save:()=>undefined) all nine are as before. Were W7 5f125352, B2 3b5d8035)
// (W7 re-recorded 2026-10-23, on purpose, the owner's world log (agent WL: world/worldlog.js worldEvent): a world event you neither
//  took part in nor saw nor hear of by your realm's rider is news only, so the three days' save holds fewer war lines in the
//  chronicle and more news (war, peace and alliances, new armies, starving garrisons; what you learnt marked heard). Nothing else
//  moves: W1-W6, W8, B2 and the battle suites hold. Checked: with the gateway off (WORLD_LOG.on false) all nine are as before.
//  Was W7 a5c23047)
// (W7, B2 re-recorded 2026-10-23, on purpose, at the world log's merge: the save's rng piece now truly last (core/rng.js order
//  270 to 900, after band, tracks and chronicle: nothing loaded after it can move a restored stream; tests/streams.js wants it
//  last). Only the saves' key order moves. Were W7 ae446562 (the world log's), B2 8b5de408)
// W6 re-recorded 2026-10-23 for the requested brown HUD: the minimap has a gold outer frame and brown inner rim.
// Only those frame pixels move (parts 5bbf9f8b 2eecd9ea eaa57e59 ad7efa58 4403a5ea 8319b986); with the original
// gfx/render.js restored W6 is b5185fc6 again. W1-W5, W7, W8, B2 and every generator sum held.
// (W7 re-recorded 2026-10-24, on purpose, the owner's water (agent WK: world/supply.js, data/places.js CONTAINERS): one water is
//  one person's day of drink (SUPPLY.drink.perDay 1, was a quarter: (people + 1) ÷ 6 an hour), a new hero sets out with 4 full
//  waterskins (was the 2 days' 8 water) and each water drunk leaves an empty waterskin in the bag, so the bag in the three days'
//  save moves. W8 (places only) and B2 (saved before the first frame gives the skins) hold, as do W1-W6 and the generator's sums.
//  Checked: with perDay 4 (the old unit) and the skins off (no empty skins from drinking, filling as before, the start filled to
//  2 days, no recruit's skin) W7 is d2479c86 again. Was W7 d2479c86)
// W7 re-recorded 2026-10-24 for the requested persistent Journal discoveries: the optional known save piece stores
// learned realms, holdings and dated lord reports. Omitting only that piece restores d2479c86 (a temporary fixture,
// 16 checks passed). W1-W6, W8, B2 and every generator sum held; no simulation or art change.
// (W7 measured 2026-10-24 at the full sweep of f689b02: the waterskins (alone 29dbbd3a) and the Journal's known piece (Codex alone
//  9a7c43d8) together, f79b1a9c)
// W7 re-recorded 2026-10-24 for the discovery correction: passive sightings no longer identify unknown lords, so known
// holds fewer lord records. Restoring only the old watch rule restores f79b1a9c (temporary diagnostic: 16 checks passed).
// W1-W6, W8, B2 and every generator sum held; no simulation, rendering or save-schema change.
// W6 re-recorded 2026-10-24 for native-resolution world-map labels (Arial and a dark outline), requested for legibility.
// Was 6b64690d; now ca946ef1 (parts b20337fd 06f656b2 c148aa51 0c40944c 4403a5ea 8319b986). Switching only the
// queue flush back to txt restored the old W6 and all 16 checks. World data, simulation, saves, W1-W5, W7-W8 and B2 held.
// (W1, W3, W4, W5 re-recorded 2026-10-30, on purpose: the woods' glades (worldgen.js GEN_GLADE, stage 9b, after the holdings, roads
// and camps, so none of them moved) open ground in every wood of the world; W2 the same as before)
// (W3, W5-W8 and B2 re-recorded 2026-11-01, on purpose, at the sweep fix after the night of 2026-10-31. The baseline had stood since
//  4dd5c19 for W6-W8 and B2 (7abcc4c re-recorded only W1, W3-W5). Every move since, found commit by commit on the first-parent
//  history (a worktree at each commit, worldprint -Seed 1), each at a deliberate change by its message:
//  696de87 the owner's notes of 2026-10-25 (world speed, stamina): W7 b1a67c01>362675f6, W8 a465c56e>a1706c0a; e429a13 (wages),
//  544a6ad (world projectiles), 00ff53a (travel suspicion), a370b85, 251e298, 7bf495e (the awareness eyes): W6 ca946ef1>37d46e05>
//  4ba9619b>c6e62cc9>b9abfd36>0309b69e>00e43885; 177605b wildlife flee NPCs: W7 >e9ae8f2b, W8 >1e44ed99; aa3ed8d escape fatigue and
//  hunting areas: W6 >73de5eed, W7 >5d14aa18, W8 >638acc9a, B2 8712b6a2>041ef9cb; 67d4a94 free-for-alls: W7 >75359bd7; 3b9fbcb
//  waylay: W7 >953d6057, W8 >53e3067b; 322d202 a codex merge (Start Battle in the tests, sites off roads, companions' parties by your
//  group limit): W6 >5044015b, W7 >2db42af1, W8 >1b463b3e, B2 >7581642d; bebc14a captivity: W7 >8ae9da09, B2 >0a9d85fb; 3b0ff21 the
//  map's stamina badges gone: W6 >4f6f90b0; b0936ed, 7b6d7cb dialogue: W7 >8f2f1ed8>b4cee2d7, B2 >8d855332; 3634e7a prisons: W7
//  >a76f7726, B2 >57f1b515; d3158a5, 03371f2 hosts: W7 >90adcffc>1ef4227c, B2 >06ffd309; 46be83f the Nobody: W7 >0fd83ad6, B2
//  >664a93ef; 577cae4 a hero sprite (W6 >384c2ff4>95bb5a6e), reverted at 762e128 (W6 4f6f90b0 again); 7abcc4c the glades (W3
//  224e40e8>ba811bfe, W5 f284901d>59a8b3fa, recorded there): W6 >4d0788c2, W7 >e630360c, W8 >b9ea3d9d, B2 >22b80ef5; f8c7c00 world
//  battles on in the tests: W6 >4aaf2ce9, W7 >f29bdc5b; 1765c21 marchers apart: W6 >6e7aee49; 454af04, 8ddd843, 72cbebc ranks: W7
//  >46a6a16b>656144af>f0407fe0, B2 >27249675; 367c115 beasts on lords: W7 >0e5cee1e; 275f3d2, b6543dc the smooth march, 62aee5f
//  idle life, 6e66dd7 recruited prisoners: W6 >998cb9c6>1f61299e>c832c8c5>9d0d3a44; 803bd3a whole units: W3 >acc3f66b, W7
//  >ca58c8e8, B2 >0abb1e12. Then the night of 2026-10-31: the building clusters re-laid (engine/build*.js): W5 59a8b3fa>0b1fd5be,
//  and W6's first two spots; the troop tree (data/units.js, races.js, matchups.js, world/holding.js: the kinds, their names and
//  stats, the hires, the mage): W3 acc3f66b>3d4ee001, B2 0abb1e12>ccd4914c, with W7, W8 and W6's first two spots; the map's tiers
//  (WORLD_LOD) and travel 1.6x (WORLD_SCALE.travel): W7 ca58c8e8>ec3fbce8, W8 b9ea3d9d>8a273919; the figures (body and gear),
//  the map banner and the rings on the men's middle: W6 9d0d3a44>2686f07a (all six parts, cd1e7875 7684c955 454f6f5f 647fde13
//  ab701f26 b4d2da5e to f8f4b413 788a4114 a7dc90b5 2394fece 08abb60a 78a4df10). Checked: with engine/build*.js and those four troop
//  files as at 803bd3a, WORLD_LOD.on false and WORLD_SCALE.travel 2, W3, W5, W7, W8 and B2 are 803bd3a's again. W6 then still
//  differs at all six parts, also with world battles off (no marchers drawn: the map's small figures and banners) and with
//  gfx/people.js, sprites.js and weapons.js as at 803bd3a: its last part is the drawing, not proven by a switch (render.js and
//  march.js as at 803bd3a do not load with the rest). W1, W2, W4 and the five sums held)
// (W6 re-recorded 2026-11-01, on purpose, your sight every man's (fog.js Sight; the owner: "the vision and fog of war should be
//  based on all army units not only heroes"): the remembered scene is cut out under each eye by a feathered disk drawn once a
//  radius and stamped (fog.js fogDisk; a gradient drawn afresh for a dozen eyes cost ms a frame), not a gradient drawn at the eye
//  each frame, so its rim's alpha comes from a picture: measured on begin's screen, one pixel's alpha 1/255 apart. All six parts
//  move (f8f4b413 788a4114 a7dc90b5 2394fece 08abb60a 78a4df10 to ed2680a6 85467fe0 ee00bcaa 6cb20dd5 28b24219 205b4506). Checked:
//  with the cut-out drawn as before (a gradient disk at each eye, straight onto the scene) and the new sight whole (your army's
//  middle and every man's eye), W6 is 2686f07a again: begin's spots see as before (you alone, your eye where you stand). W1-W5, W7,
//  W8, B2 and the five sums held: what you learn and the save unchanged. Was W6 2686f07a)
// (W7 re-recorded 2026-11-01, on purpose, a host's column by its rings (world/hosts.js Host#back, Host#places; the owner: "big army,
//  bigger interaction touchpoint", armies never inside one another): a marshal's lords march each its ring behind the one ahead,
//  HOSTS.gap px between the rings, not 22 px apart, so the realms' campaigns move as the days run. Checked: with world/hosts.js as
//  before (march.js's jam rule kept), W7 is ec3fbce8 again; W1-W6, W8, B2 and the five sums held. Was W7 ec3fbce8)
// (W6 and W8 re-recorded 2026-11-01, on purpose, the army is where its men are and its ring the outline of their ground (march.js
//  MARCH_MOVE.menCentre, MARCH_RING; the owner: "why don't you calculate the center based on unit's position", "how about making a
//  ring like freeform based on the area?", meetings measure to the outline). W6: the rings drawn are your men's outline, not
//  circles, and you stand where your men are (the camera with you): all six parts move (ed2680a6 85467fe0 ee00bcaa 6cb20dd5 28b24219
//  205b4506 to 7617572a 1096644e eccb3319 93623e46 cfaf7c14 dcfb8c7f). W8: every army near you put at its men's middle each
//  moment, a little behind where its brain moved it (you at 1430.8,1447.4 for 1430.9,1447.4), so the parties' places after 600
//  frames move. Checked: with MARCH_MOVE.menCentre, MARCH_RING.on and MARCH_RING.meet false, W6 is 4624b5bf and W8 8a273919
//  again; W1-W5, W7, B2 and the five sums held both ways. Was W6 4624b5bf, W8 8a273919)
// (W6, W7 and W8 re-recorded 2026-11-01, on purpose, road travel by column (the owner, 2026-11-01: "when travel by road it will
//  force the marching to columns in order to snap them near the road, this should apply for all armies, otherwise no road bonus";
//  marchstyles.js TRAVEL_STYLES, TravelStyle, MarchColumn; world.js armyGround). Each army marches in its kind's travel style (a
//  column for a caravan, a lord on a long trip, a patrol on its beat) and its ground, so its pace, is its men's, not its point's.
//  W6: the first two spots' views by day and night move (7617572a 1096644e eccb3319 93623e46 to 90b8a0b7 ceb52f86 7ad32b78
//  c4206294), the third spot's two as before. W8: the parties' places after 600 frames (you at 1430.4,1447.2 for 1430.8,1447.4;
//  bands 75 for 74, fights 0 for 2). W7: the three days run so (a save 277499 chars for 261889). Checked: with TRAVEL_STYLES.on false (no columns, the
//  ground at each army's point), W6 is 83e0a0f1, W7 26e752f8 and W8 f3fea1fb again; W1-W5, B2 and the five sums held both ways.
//  Was W6 83e0a0f1, W7 26e752f8, W8 f3fea1fb)
// (W7 and W8 re-recorded 2026-11-01, on purpose: men fill the nearest free place (the owner, 2026-11-01: "when unit groups moving
//  in march formation or battle, just make units try to fill the position instead of fixed to one specific unit"; core/assign.js
//  SLOTFILL, world/march.js MarchArmy refill, battle/formations.js layForm). A group's men on the march take its places by the
//  least walking in all (its rows made again, a column formed or broken, its places turned, now and then on the march), and an
//  army is where its men are (menCentre), so the armies near you stand a little elsewhere: W8 the parties' places after 600 frames
//  (you at 1430.4,1447.2 as before; a save of the same counts), W7 the three days run so (a save 274063 chars for 277499). Checked:
//  with SLOTFILL.on false, W7 is da07007c and W8 235d3b93 again; W1-W6, B2 and the five sums held both ways. Was W7 da07007c,
//  W8 235d3b93)
// (W7 and B2 re-recorded 2026-11-01: unit kits step 2 (the owner, 2026-11-01), the part that moved them RANKS.mastery5: the world
//  part of a save carries its 'kits' piece (core/ranks.js: a save made before the five mastery levels is told apart, its groups'
//  picks read again; nine chars more, 274072 for 274063). Checked: with every part of step 2 off, W7 640de23c and B2 ccd4914c again;
//  W1-W6, W8 and the five sums held. Was W7 640de23c, B2 ccd4914c)
// (re-recorded 2026-11-01, the three women lords' titles (the owner: "change whatever you see fits for now, just make sure it can
// be changed in the future"; data/factions.js LORD_RETITLE: Clanmother Borka, Clanmother Gimra, Warmother Ulgra): their names are in
// the world's state. Proof: LORD_RETITLE {} gives W7 cd936f95 and B2 0dfcc7a7 again. Were W7 cd936f95, B2 0dfcc7a7)
// (re-recorded 2026-11-01, armies see by every man, lords keep to roads (the owner): W7 c86932ec → 5c351a7f, the lords' road keeping
// on long trips (marchstyles.js TRAVEL_STYLES.lordKeep 1.1; the routes' cache keyed by each road cost, router.js, moves nothing here).
// Proof: lordKeep 1 gives c86932ec again. Was W7 c86932ec)
// (re-recorded 2026-11-01, a bug fix: a lord over his unit slots lost the men he trained up (realms.js lordRecruit took the unit
// off, then the add was refused: no slot); now he trains none till he is within them. Proof: the guard taken out gives 5c351a7f
// again. Was W7 5c351a7f. The army's footing (march.js MARCH_MOVE.footing) moves nothing here)
// (re-recorded 2026-11-01, on purpose: no banner floats over an army (the owner: "remove a floating banner, show the banner detail
// only when you inspect them along with the detail window"; render.js drawBanners, ui.js tipFlag): W6, the map's pixels, without
// your banner, your eye and badges over your hero (heroTagAt). Proof: that patch's code taken out gives 738abfed again; W7, W8
// (the world's own) held. Was W6 738abfed)
// (W7 and W8 re-recorded 2026-11-01, on purpose, about face (the owner: a column sent the other way "kind of chaos, it takes several
//  seconds just to turn around"; march.js MARCH_MOVE.about, MarchArmy aboutColumn, reorder; marchstyles.js MarchColumn turn, pass):
//  an army near you sent back the way it came turns where it stands (a column's tail its head, a formation laid as it stood, its
//  guide on at once), its order coming back after a long leg or a halt, so the armies that turn back stand elsewhere. Outriders on
//  the map (march.js marchOutriders) moves nothing here: no army in it has the perk. W6 re-recorded with them, on purpose: the
//  army's flags on its marching men and torches after dark (gfx/marchgear.js; the owner: "20% of unit for each group", torches
//  "every army can use during night time"), drawn in the map's pixels. Checked: with MARCH_MOVE.about.on and MARCH_GEAR.flags and
//  torches false, W6 a1d57a54, W7 94c785ba and W8 71df061a again; the rest held. Were W6 a1d57a54, W7 94c785ba, W8 71df061a)
// (W6 re-recorded 2026-11-01, on purpose, realistic fire (the owner: "can you change a fire effect to be more realistic?";
//  gfx/fire.js): torches, camp and site fires drawn as they burn (PX.fireFlame's frames, by noise of the clock and their ids), the
//  night's lights pulsing unevenly with a pool on the ground and no small flame of their own over the torches'. Only the night's
//  three parts moved (63bf262d b5d6edb6 607ee460 to 56f76e49 1e3b5c68 0d2d6889); the day's held. Proof: FLAMES.on false gives
//  de8bb9db again; W1-W5, W7, W8 and B2 held. Was W6 de8bb9db)
// (W6 re-recorded 2026-11-01, on purpose: another army seen by its nearest man and drawn only where you see it (worldobject.js
//  spotted, march.js marchDraw; the owner: "a huge army roaming around but suddenly disappear even with in just few feet away"):
//  the map's pixels. Checked: SIGHT_EYES.armies false gives 06a05ba5 again; W7, W8 and the rest held. Was W6 06a05ba5)
// (W6 re-recorded 2026-11-01, on purpose, paths round obstacles (the owner: "can you make the pathfinder better for obstacles?
//  right now the units seem to bump into boundaries, houses, etc. which sometimes make them stuck"; and the buildings' footings: "make
//  sure that you also make the buildings actually have hidden wall that cannot be walked by in the map"; battle/route.js PATHS,
//  world/march.js marchFootings): your men at the first spot, by Ashford's centre (whose own foot is as before), keep their bodies'
//  room off its walls, so they stand a little elsewhere. Only the first spot's two views moved (c9c1d9ac 56f76e49 to 63b9fd07
//  19472329); the other four held. W7, W8, B2 and the five sums held. Proof: every PATHS switch off gives 3755c2ed again. Was W6
//  3755c2ed)
// (W6, W7, W8 re-recorded 2026-11-02, on purpose: holdings' walls solid and an army routing as one (the owner: "the holding walls is
//  not correct because the unit can walk through it"; "should the pathfinder calculated as a whole group first then make the unit
//  move together?"; battle/route.js PATHS.holding, PATHS.corridor; world/router.js holdShut), and columns that keep steady (the
//  owner: "if your army cannot form a column it'll keep reorganize and try to form the column", "for player army it should not auto
//  change formation if enemy is near"; world/marchstyles.js TRAVEL_STYLES.steady, yourChoice). W6: your men at the first spot, by
//  Ashford's citadel, now stand off its solid walls (PATHS.holding false gives c12fc40c again). W7, W8: every walker's way round the
//  holdings' walls to their gates, the armies' men by their corridors, the columns' switches held (each of PATHS.holding,
//  PATHS.corridor and steady with yourChoice off still moves both; all of them off, and MARCH_MOVE.formGiveUp, gives 13f8aeb3 and
//  bd7d9103 again; formGiveUp alone moves neither). W1-W5, B2 and the sums held. Were W6 c12fc40c, W7 13f8aeb3, W8 bd7d9103)
// (W7, W8 re-recorded 2026-11-02, on purpose: a marcher in a column keeps pace behind the comrade walking just ahead of him
//  (march.js marchLead, MARCH_MOVE.follow; the owner: "the unit will walk a bit, then stop, then walk again"), and meeting or
//  following another army aims at its edge (marchMeetAt, meetEdge), so the lords' columns and parties stand elsewhere. Checked:
//  MARCH_MOVE.follow null and meetEdge false give W7 3b34118e and W8 9a9b8841 again; the rest held. Were W7 3b34118e, W8 9a9b8841)
// (W6 re-recorded 2026-11-02, on purpose: the horse drawn as a horse (the owner: "can you fix the mounts sprites? i mean the horse
//  legs", "make sure to make it look like horse"; gfx/people.js HORSE_ART): its shape, its legs and its gaits, the mounted men and
//  riders in view at the first two spots. Proof: HORSE_ART.on false gives 6add129d again; W1-W5, W7, W8, B2 and the sums held. Was W6 6add129d)
// (W6 re-recorded 2026-11-03, on purpose: the horse's legs a px longer, its gathered gallop mended, and a horse's neck and one
//  head in every frame (the owner: "a second pass for leggier horses", a little longer only, then "dont you think the head seems
//  weird?", "the head when running is too small", "not too square"; gfx/people.js HORSE_ART.leg 1 and HORSE_ART.sized, the
//  rider sunk a px into the saddle so he sits where he did): the mounted men and horses in view at the first two spots (36e19f5c
//  5eb4083d bb7282c6 de574bd3 to 771304cb 50b850b3 a679b1ed 3a8cf2c7; the third spot's held). Proof: HORSE_ART.tall false gives 5d0472ad again; W1-W5, W7,
//  W8, B2 and the sums held. Was W6 5d0472ad)
// (W8 re-recorded 2026-11-04, on purpose: a slit between two buildings narrower than a man is shut on the march's grid (march.js
//  MarchGround shutSlits, MARCH_MOVE.slit; the owner: "unit seems to stuck if building is built like this", Ashford's guards
//  stuck in the gap by its smithy), so the patrols and lords by a holding walk round it. Proof: MARCH_MOVE.slit 0 gives c8a7a09f
//  again; W1-W5, W7, B2 and the sums held. W6, failing before this (f6ec2a06), moves with it to 3b1b4245 (men drawn where they now
//  stand); not re-recorded here. Was W8 c8a7a09f)
// (all nine re-recorded 2026-11-05, on purpose: the hamlets (doc/WORLD_DESIGN.md §6.3; the owner, "implement the hamlet and small
//  villages", the classic world to have them too): the classic seed's 24 free hamlets and villages, their roads, lots and estates
//  (W1-W3), the land and the world they share (W4-W6), the play on it (W7, W8) and the save (B2); and the lots' rules mended on it
//  (lots.js: every centre and the ground before each gate kept clear, a new world's estate tracks laid once every holding stands,
//  as a load lays them, a holding's lots walked to on foot with no ferry, a hamlet's estates on its own bank, a spur left in a
//  centre's ring opened). Proof for the generator: the sums below. Were W1 21d9cb5a, W2 975f62a1, W3 3d4ee001, W4 2bf73f82,
//  W5 0b1fd5be, W6 08300b7e, W7 b30568ab, W8 d229693c, B2 db4c9cc7)
// (W7 and B2 re-recorded 2026-11-05, on purpose: the humble start (doc/START_AND_GATES_DESIGN.md §1): every save keeps where you
//  began (P.home: your people's capital here, the harness's HUMBLE_START off). Proof: without the field both as before; W1-W6, W8
//  and the sums held. Were W7 6683fb0e, B2 905b24f3)
// (W7 and B2 re-recorded 2026-11-05, on purpose: the gates (doc/START_AND_GATES_DESIGN.md §2): every save keeps the holdings a quest
//  has sealed (the save piece sealed, world/gates.js: none here). Proof: without the piece both as before; the rest held. Were W7
//  f54cb046, B2 33568fdf)
// (W7 and B2 re-recorded 2026-11-05, on purpose: the ways past a gate (doc/START_AND_GATES_DESIGN.md §2.2, G2): every save keeps your
//  passes and the gates that know your face (P.passes, P.gateBan: none here). Proof: without the two fields both as before; the
//  rest held. Were W7 1a98e730, B2 3de81ea5)
// (W7, W8 and B2 re-recorded 2026-11-05, on purpose: the beasts far from the holdings and off their land (the owner: "monsters should
//  spawn far away from holdings. And they tend to avoid holding territories": WORLD_SCALE.spawn.monsterHold 256 px, was 64;
//  monsters.js beastKeepsOut), so the beasts lair and walk elsewhere. Proof: monsterHold 64 and beastKeepsOut off give all three
//  again; the rest held. Were W7 9e363d9f, W8 05f25f36, B2 7bbd9370)
// (W7 and B2 re-recorded 2026-11-06, on purpose: two kinds of hideout (the owner: "bandit hideout using camp sprite and bandit
//  lairs that may look like tunnel or cave"): HIDEOUT_LAIR.share of the hideouts are bandit lairs, by a hash of their tile, named
//  and drawn as one (a cave's mouth or a dug tunnel). Proof: share 0 gives both again; the rest held. Were W7 46f8b18a, B2 254d8a0a)
// (W3, W5, W7, W8 and B2 re-recorded 2026-11-06, on purpose: towns stand open (the owner: only castles, forts and cities walled; one
//  citadel a realm): a town's centre its hall and market (the townhall cluster, was a citadel) and no walls (wall0 0, was 2), so its
//  lots, its picture, its sieges and the save change. Proof: the town's old centre and walls give all five again; the rest held. Were
//  W3 ac2aba75, W5 414df094, W7 e9783bae, W8 065d57eb, B2 e9d35de0)
// (all nine re-recorded 2026-11-06, on purpose: the fort kind (the owner: "only castle, fort, city should have wall", "a new fort
//  kind"): each realm's village nearest a rival's made a small walled fort (worldplace.js placeForts), the classic world's five in its
//  own data (places.js: Coldmarch, Frosthelm, Gullhaven, Thistledown, Dustfang), so the holdings' kinds, lots, walls, garrisons,
//  roads round them and the save change. Proof: no forts (PLACE_FORT per 0, big 999, the five villages again) gives all nine and the
//  five sums again. Were W1 93537e2b, W2 264a7c7f, W3 d7f57400, W4 fbefe32d, W5 077d5587, W6 a8409953, W7 d8c679f9, W8 1d159ce7,
//  B2 394b7a5e)
// (W1, W3-W8 and B2 re-recorded 2026-11-06, on purpose: a holding's streets (the owner: "the buildings actually connected to the
//  road, if there's a lot of space the smaller ones"): its houses drawn to the road, small things a tile each along its streets
//  (nook lots), lanes worn from its doors to the road (lots.js LOT_STREET), so its lots, its picture and the save change; the
//  generator's sums held. Proof: LOT_STREET front 0, no nooks, lane max 0 gives all eight again. Were W1 8dc0ec99, W3 e5fc35f5,
//  W4 7caa9d3b, W5 7606b637, W6 3627d2a4, W7 1db84b36, W8 b3ff4495, B2 8a52874f)
// (W5, W6 re-recorded 2026-11-06, on purpose: a townhouse jettied front and back alike, so the towns' pictures change. Proof: the
//  one-sided jetty gives both again. Were W5 32f76f9f, W6 ec28b2c6)
// (W6 re-recorded 2026-11-06, on purpose: no long line of one colour on the buildings (engine/model.js breakRuns). Proof: RUNS.len
//  999 gives it again. Was W6 6e990bb2)
// (W5, W6 re-recorded 2026-11-06, on purpose: every lot on a yard of the land's worn earth and wider lanes (lots.js LOT_STREET yard,
//  lane), so the towns' pictures change. Proof: yard amt 0 and lane r 3 give both again. Were W5 dd631ed3, W6 de8a1345)
// (W5-W8 and B2 re-recorded 2026-11-06, on purpose: no square on the ground (the owner): the ground kept clear round each lot, gate,
//  camp and lane a rounded patch with a ragged rim (was a square), lanes stepping diagonally, their bends smoothed and wandering
//  a pixel or two, so the woods
//  grow otherwise round the holdings: the pictures, and what reads the woods as painted (the parties' ways, the save). Proof: aecf343,
//  these alone back, gives all five again. Were W5 14ec3130, W6 e7a48c56, W7 5bb3e27d, W8 a63c35d9, B2 58769e81)
// (W5, W6 re-recorded 2026-11-06, on purpose: the roads painted as worn earth (the owner: "straight lines with a transparent middle"):
//  their middle mottled earth, a track's crown grassed only in tufts, ruts in stretches, their edge broken (worldart.js ROADLOOK).
//  Proof: 81bc537, this alone back, gives both again. Were W5 796f4221, W6 5b7a8487)
// (W6 re-recorded 2026-11-06, on purpose: the soldiers and people on foot are paper dolls (engine/doll.js, gfx/dollfigs.js), so
//  the figures in its picture change; the battles' fingerprints held. Proof: eccde03, the figures as they were, gives it again. Was
//  W6 33e6041d)
// (W6 re-recorded 2026-11-06, on purpose: a paper doll's weapons as the owner's reference holds them (weapons.js HOLD_DOLL: a spear
//  across his back, a sword low; a line a pixel wide, unoutlined), the figures in its picture change. Proof: 5dcdc5d gives it again.
//  Was W6 b0f623df)
// (W6 re-recorded 2026-11-06, on purpose: paper dolls painted from a grayscale base (engine/doll.js PX.dollBase, dollPaint), their
//  cloth's mottle seeded by the man (never his side's colours) so every side shares his base: the figures in its picture change.
//  Proof: 259032c gives it again. Was W6 cc1f4852)
// (W6 re-recorded 2026-11-06, on purpose: a paper doll's weapon heads (weapons.js drawBlade thin: a spearhead's socket and leaf, a
//  sword's lit point and pommel), so the figures in its picture change. Proof: 2d27006 gives it again. Was W6 548e8fda)
// (W6 re-recorded 2026-11-06, on purpose: riders paper dolls, mounts with no outline, their edges a shade darker, a doll's
//  spearhead on its shaft's last pixels; the figures in its picture change. Proof: b4d4bf1 gives it again. Was W6 d2dd984e)
// (W6 re-recorded 2026-11-07, on purpose: the owner's sprite notes of the day, the figures in its picture only: pinholes filled
//  (people.js pfillHoles, 4c3b109), the walk's steps (doll.js POSES.walk, 374cc79), the horses' legs fuller (people.js horseLeg,
//  a1a15d2), the marchers' flags with no outline (marchgear.js, 9df57b4); W1-W5, W7 and W8 held at each. Proof: ebb0794 gives it
//  again. Was W6 42e6d237)
// (W6 again 2026-11-07, on purpose: the owner, "recheck any weird distorted pixels": a pinhole's colour the one most of its
//  neighbours share and a figure's loose pieces joined to it (people.js pfillHoles, pjoin; engine/beasts.js fillHoles, joinLoose):
//  the figures in its picture only. Proof: 8aaa2d8 gives it again. Was W6 d2f79352)
// (W5, W6 re-recorded 2026-11-07, on purpose: the owner, "the outline should blend with the sprite, a darker colour or shade of
//  it": every building's, tree's, rock's and mountain's outline a deep shade of what it borders, not navy (engine/pixel.js PX.rim,
//  model.js, worldnature.js): the painted world and its picture. Proof: PX.RIM.on false gives both again. Were W5 2e40b15c, W6
//  be5c3c88)
// (W6 again 2026-11-07, on purpose: round every figure on the map, a marcher, a rider, a beast, an animal, a blended outline, a deep
//  shade of what it borders (people.js prim, DOLL_FIGS.rim; engine/beasts.js PX.BEAST_RIM). Proof: both false give it again. Was
//  W6 d4ecf1f2)
// (W6 again 2026-11-07, on purpose: shields before the off arm with each people's device, each class's helm its own (a crest, horns,
//  a circlet, a wizard's hat, a skull): the figures in its picture. Proof: 0f9504c gives it again. Was W6 385930b9)
// (W6 again 2026-11-07, on purpose: the figures' outline natural, not square: thin lines unringed, the lit side lighter (people.js
//  prim, engine/beasts.js outline). Proof: 5ff3c16 gives it again. Was W6 d9a0271d)
// (W6 again 2026-11-07, on purpose: the owner's audit of the battle and the map's figures: the outline inside each figure, every
//  figure's feet on its row, the map's flags the battle's, weapons held as in battle and never through the ground, kneelers on the
//  ground. Proof: 9243c05 gives it again. Was W6 93f6a84f)
// (W6 again 2026-11-07, on purpose: the owner, "what's this?": a marcher drawn under a screen pixel a sprite pixel (this fixed
//  view's scale) shrunk first, each pixel the opaque one nearest its block's middle, so his spear's shaft and his flag's pole stay
//  whole (render.js mapPic, reduced). Proof: ca6ab67 gives it again. Was W6 24abfcf2)
// (W6 again 2026-11-07, on purpose: the owner's 4: a marcher's fist laid over his weapon's grip (render.js drawGrip): the figures
//  in its picture. Proof: 01eb8c5 gives it again. Was W6 9b70e5df)
// (W6 again 2026-11-07, on purpose: the owner, "the sword looks bending": a thin weapon drawn along the nearest of the slopes a
//  line steps evenly on (weapons.js cleanDeg): the marchers' weapons in its picture. Proof: 6fd183f gives it again. Was W6 8cd3d4d8)
// (W6 again 2026-11-07, on purpose: the owner, "not bending like a soft object": a doll's head and body never moved against each
//  other (no dip, lean or glance), only its limbs, a weapon's angle the same the whole walk (dollfigs.js DOLL_MOVES, doll.js
//  POSES.walk, weapons.js DOLL_DROP): the marchers in its picture. Proof: 55f13f5 gives it again. Was W6 55f6206b)
// (W6 again 2026-11-07, on purpose: the owner, "align flags use in all place. Camps, building": a holding's, a site's and a
//  siege camp's flag the battle's banner on a pole, an army's map banner outlined inside (structures.js flagSprite, sprites.js
//  bannerSprite): the towns' flags in its picture. Proof: 96b6711 gives it again. Was W6 de3dcb10)
// (W6 again 2026-11-07, on purpose: the owner, "make sure mount have more details": a horse's mane, shading and tack, a cloth
//  under every saddle, the stag's rack, the ram's fleece, the wolf's coat (people.js horseDetail, HORSE_TACK; engine/beasts.js
//  MOUNT_ART): the riders in its picture. Proof: 9b6a5bc gives it again. Was W6 313ddf12)
// (W6 again 2026-11-07, on purpose: the owner, "the mount portions still weird, check distort pixel": a horse's body two rows
//  deeper, a caparison to its belly, no reins or blotches (people.js HORSE_ART, horseDetail): the riders in its picture. Proof:
//  f20888e gives it again. Was W6 d82c660f)
// (W6 again 2026-11-07, on purpose: the owner, "add detail like furs, or shading to mounts": every mount's coat shaded down its
//  body, a wolf's and a ram's in fur (people.js mountCoat): the riders in its picture. Proof: 4f6f01f gives it again. Was W6 8e356ba3)
// (W6 again 2026-11-07, on purpose: the owner, "hero sprite looks weird", "too blocky and no need the crown": your hero in what he
//  wears, a jerkin over linen sleeves, his cape behind him only, no crown; an item's colour shaded (people.js lookOf, dollfigs.js
//  dollParts, engine/doll.js cloak): you in its picture. Proof: abf740f gives it again. Was W6 ab47f824)
// (W6 again 2026-11-07, on purpose: the owner, "blue cape is a square": a cape a mantle and a hanging edge, never a block
//  (engine/doll.js cloak): every caped man in its picture. Proof: 80b4972 gives it again. Was W6 d1d8030e)
// (W6 again 2026-11-07, on purpose: the owner, "please remove cape and revise head": your hero without a cape, his hair a crop
//  and an eye on his face (engine/doll.js crop, eye; people.js lookOf): you in its picture. Proof: 0f83689 gives it again. Was W6
//  4a1df363)
// (W6 again 2026-11-07, on purpose: the owner, "make the head look more forward": your hero's head seen from before him, his hair over
//  the top and a sideburn either side, his face its full width and two eyes (engine/doll.js crop, face, eye): you in its picture.
//  Proof: a2c7152 gives it again. Was W6 2c2de2df)
// (W6, W7 and B2 again 2026-11-07, on purpose: the owner, "utilize the portrait generator ... the lords, named heroes, companions
//  ... make hair style match with portraits": your face made as the game starts and kept in the save (its 'faces' key: W7, B2),
//  your figure's hair and beard your face's (W6) (ui/faces.js). Proof: FACES.on false gives all three again. Were W6 1c937eb8,
//  W7 0ad8975e, B2 484f767d)
// (W7 and B2 again 2026-11-07: the portrait engine's own update (c3a2978: soldier presets, armour, race helmets) draws your first
//  face otherwise, kept in the save. Proof: 39065a4, its merge, gives both already. Were W7 c8d71a5e, B2 2bb96756)
// (W6 again 2026-11-07, on purpose: the owner, "make heroes walking animation leg not spread", "why it's bob?", "head too big":
//  a step's legs straight under him, your hero's hair on his scalp, medium and long hair behind his neck (engine/doll.js POSES.walk,
//  crop, cropMid, cropLong, cropBun): the marchers and you in its picture. Proof: 39065a4 gives it again. Was W6 d453ae6d)
// (W7 and B2 again 2026-11-07, on purpose: the owner, "check battle map vs the actual faction sprites align": a realm's armies
//  its own peoples, the Salt League's lords no longer fielding the dwarves of a town it holds (world/realms.js Realm#races): the
//  lords' troops in the save. Proof: bf238d8 gives both again. Were W7 1b77d886, B2 1bfb3eb5)
// (W6 again 2026-11-07, on purpose: the owner, "fix posture" and "what is that brown thing": a bowman's quiver slung close behind his
//  shoulder, its fletching by his head (figures.js QuiverGear; it was a box at his hip), the string drawn to his chin (BOW_PULL): the
//  marching bowmen in its picture. Found commit by commit from f03ff9a: f949f0a moves it, nothing after. Proof: f03ff9a gives it again. Was W6 1242b66b)
const EXPECT={W1:'98411198',W2:'8e3ee885',W3:'7fd84ad4',W4:'55a05137',W5:'c77905d4',W6:'d302d69f',W7:'a9857aab',W8:'f6fce34e',B2:'87554a09'};
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
// (all five re-recorded 2026-10-30, on purpose: the woods' glades, GEN_GLADE; the generator's stages before 9b as before)
// (all five re-recorded 2026-11-05, on purpose: the hamlets, the generator's stage 7b (worldplace.js genHamlets), at Normal in
//  every preset and the classic world. Checked: with the Hamlets setting None the generator makes what it made before them (Normal s1
//  at None 1a9d3280 on 244e94c, before the hamlets, and now; the setting is part of the sum, so None is not the old Normal's value).
//  Were classic c2e6ebf4, Normal s1 7de4f831, s2 994d7cb0, s3 d0b32a24, Large s1 03a19dc7)
// (all five re-recorded 2026-11-06, on purpose: the forts (above). Proof: no forts gives all five again. Were classic 313f5680,
//  Normal s1 c05c2a0b, s2 71336fed, s3 88b17161, Large s1 66607a42)
const SUMS={classic:'376eb788','Normal s1':'0620ac51','Normal s2':'8d537d0c','Normal s3':'3c103cb4','Large s1':'1a0f554e'};
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
 const paint=()=>{const c=t.worldCv();return [fnv().b(words(c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,c.width,c.height).data)).x,c.width+'x'+c.height]};
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
